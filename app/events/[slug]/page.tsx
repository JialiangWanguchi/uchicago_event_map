import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { SaveButton } from "@/components/save-button";
import { getCurrentUserId } from "@/lib/auth";
import { getEventBySlug, getSavedEventIds } from "@/lib/data";
import { hasSavedEventsConfig } from "@/lib/env";
import { formatEventDate, stripHtml } from "@/lib/utils";

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <article className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
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
            <p className="mt-3 text-base text-slate-600">{formatEventDate(event.start_at, event.end_at)}</p>
          </div>
          <SaveButton eventId={event.id} initiallySaved={savedIds.has(event.id)} enabled={canSave} />
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-700">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.location_text ?? event.venue_name ?? "Location TBD"}
          </span>
          <a
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
          >
            Open original listing
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        {event.description ? (
          <div className="mt-8 whitespace-pre-line text-sm leading-7 text-slate-700">
            {stripHtml(event.description)}
          </div>
        ) : (
          <p className="mt-8 text-sm text-slate-600">No detailed description was provided in the upstream feed.</p>
        )}
      </article>
    </main>
  );
}
