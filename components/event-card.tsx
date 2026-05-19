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
  distanceLabel?: string;
  endTimeUnknown?: boolean;
};

export function EventCard({ event, isSaved, canSave = false, selected = false, onSelect, distanceLabel, endTimeUnknown }: Props) {
  return (
    <article
      id={`event-card-${event.id}`}
      className={cn(
        "rounded-lg border p-5 shadow-panel transition",
        selected ? "border-amber-400 bg-amber-100 ring-2 ring-amber-200" : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            {event.categories.slice(0, 2).map((category) => (
              <span key={category} className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                {category}
              </span>
            ))}
            {endTimeUnknown ? <span className="text-amber-700">End time unknown</span> : null}
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
        {distanceLabel ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{distanceLabel} away</span> : null}
        {event.tags[0] ? (
          <span className="inline-flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {event.tags[0]}
          </span>
        ) : null}
        <a href={event.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
          Original listing
          <ArrowUpRight className="h-4 w-4" />
        </a>
        {onSelect ? (
          <button type="button" onClick={onSelect} className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline">
            Show on map
          </button>
        ) : null}
      </div>
    </article>
  );
}
