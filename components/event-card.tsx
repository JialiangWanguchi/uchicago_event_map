"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, Tag } from "lucide-react";
import { cn, formatEventDate } from "@/lib/utils";
import { SaveButton } from "@/components/save-button";
import type { EventRecord } from "@/types/event";

type Props = {
  event: EventRecord;
  isSaved: boolean;
  canSave?: boolean;
  selected?: boolean;
  onSelect?: () => void;
};

export function EventCard({ event, isSaved, canSave = false, selected = false, onSelect }: Props) {
  return (
    <article
      id={`event-card-${event.id}`}
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-white p-5 shadow-panel transition",
        selected ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            {event.categories.slice(0, 2).map((category) => (
              <span key={category} className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                {category}
              </span>
            ))}
          </div>
          <div>
            <Link href={`/events/${event.slug}`} className="text-xl font-semibold text-slate-950 hover:text-brand-600">
              {event.title}
            </Link>
            <p className="mt-2 text-sm text-slate-600">{formatEventDate(event.start_at, event.end_at)}</p>
          </div>
        </div>
        <SaveButton eventId={event.id} initiallySaved={isSaved} enabled={canSave} />
      </div>

      {event.summary ? <p className="mt-4 text-sm leading-6 text-slate-700">{event.summary}</p> : null}

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {event.location_text ?? event.venue_name ?? "Location TBD"}
        </span>
        {event.tags[0] ? (
          <span className="inline-flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {event.tags[0]}
          </span>
        ) : null}
        <a
          href={event.source_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
        >
          Original listing
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
