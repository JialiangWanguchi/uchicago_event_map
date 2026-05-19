"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, Tag } from "lucide-react";
import { formatCountdownToStart, getEventTimeStatus } from "@/lib/event-status";
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
  now?: number;
};

export function EventCard({
  event,
  isSaved,
  canSave = false,
  selected = false,
  onSelect,
  distanceLabel,
  endTimeUnknown,
  now = Date.now()
}: Props) {
  const status = getEventTimeStatus(event, now);
  const countdown = status === "upcoming" ? formatCountdownToStart(event.start_at, now) : null;

  return (
    <article
      id={`event-card-${event.id}`}
      className={cn(
        "rounded-lg border p-5 shadow-panel transition",
        selected && "border-amber-400 bg-amber-100 ring-2 ring-amber-200",
        !selected &&
          status === "upcoming" &&
          "border-blue-300 bg-gradient-to-br from-blue-50/80 to-white",
        !selected &&
          status === "live" &&
          "border-red-500 bg-white shadow-[0_0_0_1px_rgba(239,68,68,0.5)] ring-2 ring-red-400/70",
        !selected && status === "ended" && "border-slate-300 bg-slate-200/90 text-slate-600",
        !selected && status !== "upcoming" && status !== "live" && status !== "ended" && "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {status === "live" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 font-bold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
            ) : null}
            {status === "ended" ? (
              <span className="rounded-full bg-slate-500 px-2 py-0.5 font-bold uppercase tracking-wide text-white">Ended</span>
            ) : null}
            {countdown ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-800">{countdown}</span>
            ) : null}
            {event.categories.slice(0, 2).map((category) => (
              <span key={category} className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                {category}
              </span>
            ))}
            {endTimeUnknown ? <span className="text-amber-700">End time unknown</span> : null}
          </div>
          <div>
            <Link
              href={`/events/${event.slug}`}
              className={cn("text-xl font-semibold hover:text-brand-600", status === "ended" ? "text-slate-700" : "text-slate-950")}
            >
              {event.title}
            </Link>
            <p className="mt-2 text-sm">{formatEventDate(event.start_at, event.end_at)}</p>
          </div>
        </div>
        <SaveButton eventId={event.id} initiallySaved={isSaved} enabled={canSave} />
      </div>

      {event.summary ? <p className="mt-4 text-sm leading-6">{event.summary}</p> : null}

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {event.location_text ?? event.venue_name ?? "Location TBD"}
        </span>
        {distanceLabel ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{distanceLabel} away</span>
        ) : null}
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
          <button type="button" onClick={onSelect} className="text-sm font-medium underline-offset-2 hover:underline">
            Show on map
          </button>
        ) : null}
      </div>
    </article>
  );
}
