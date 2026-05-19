import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, CalendarPlus, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { DetailChatContext } from "@/components/detail-chat-context";
import { EventDetailMap } from "@/components/event-detail-map";
import { SaveButton } from "@/components/save-button";
import { getCurrentUserId } from "@/lib/auth";
import { getEventBySlug, getSavedEventIds, getSimilarEvents } from "@/lib/data";
import { geocodeSourceLabel } from "@/lib/geocode";
import { googleCalendarUrl } from "@/lib/ics";
import { hasSavedEventsConfig } from "@/lib/env";
import { formatEventDate, hasUnknownEndTime, stripHtml } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const userId = await getCurrentUserId();
  const savedIds = await getSavedEventIds(userId);
  const canSave = hasSavedEventsConfig();
  const similarEvents = await getSimilarEvents(event.id);
  const locationLabel = geocodeSourceLabel(event.geocode_source);

  return (
    <main className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <DetailChatContext event={event} />

      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <article className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
        {event.image_url ? (
          <div className="relative mb-6 h-48 w-full overflow-hidden rounded-lg bg-slate-100">
            <Image src={event.image_url} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              {event.categories.map((category) => (
                <span key={category} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {category}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">{event.title}</h1>
            <p className="mt-3 text-base text-slate-600">
              {formatEventDate(event.start_at, event.end_at)}
              {hasUnknownEndTime(event) ? " (end time not provided)" : ""}
            </p>
          </div>
          <SaveButton eventId={event.id} initiallySaved={savedIds.has(event.id)} enabled={canSave} />
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-700">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.location_text ?? event.venue_name ?? "Location TBD"}
          </span>
          {locationLabel ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{locationLabel}</span> : null}
          <a href={event.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
            Open original listing
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
            <CalendarPlus className="h-4 w-4" />
            Add to Google Calendar
          </a>
        </div>

        <EventDetailMap event={event} />

        {event.description ? (
          <div className="mt-8 whitespace-pre-line text-sm leading-7 text-slate-700">{stripHtml(event.description)}</div>
        ) : (
          <p className="mt-8 text-sm text-slate-600">No detailed description was provided in the upstream feed.</p>
        )}

        {similarEvents.length > 0 ? (
          <div className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">You might also like...</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarEvents.map((simEvent) => (
                <Link
                  key={simEvent.id}
                  href={`/events/${simEvent.slug}`}
                  className="group block rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50"
                >
                  <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-600">{simEvent.title}</h3>
                  <p className="mt-1 text-xs text-slate-600">{formatEventDate(simEvent.start_at, simEvent.end_at)}</p>
                  <p className="mt-1 text-xs text-slate-500">{simEvent.location_text ?? simEvent.venue_name ?? "Location TBD"}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </main>
  );
}
