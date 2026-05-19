import { format, isSameDay, parseISO } from "date-fns";
import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatEventDate(startAt: string, endAt?: string | null) {
  const start = parseISO(startAt);
  const end = endAt ? parseISO(endAt) : null;
  const isAllDayStart = start.getHours() === 0 && start.getMinutes() === 0;

  if (!end) {
    if (isAllDayStart) {
      return `${format(start, "EEE, MMM d")} - All day`;
    }

    return format(start, "EEE, MMM d - h:mm a");
  }

  if (isSameDay(start, end)) {
    return `${format(start, "EEE, MMM d")} - ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  }

  return `${format(start, "EEE, MMM d - h:mm a")} - ${format(end, "EEE, MMM d - h:mm a")}`;
}

export function stripHtml(input?: string | null) {
  if (!input) {
    return "";
  }

  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function isEventLive(event: { start_at: string; end_at: string | null }, now = Date.now()) {
  const startMs = new Date(event.start_at).getTime();
  const endMs = event.end_at ? new Date(event.end_at).getTime() : startMs + 3600000;
  return now >= startMs && now <= endMs;
}

export function hasUnknownEndTime(event: { end_at: string | null }) {
  return !event.end_at;
}
