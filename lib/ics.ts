import type { EventRecord } from "@/types/event";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsDate(iso: string) {
  const date = new Date(iso);
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function eventToIcs(event: EventRecord) {
  const end = event.end_at ?? new Date(new Date(event.start_at).getTime() + 60 * 60 * 1000).toISOString();
  const location = event.location_text ?? event.venue_name ?? "";
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.id}@campus-event-map`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.start_at)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    location ? `LOCATION:${escapeIcs(location)}` : null,
    event.description ? `DESCRIPTION:${escapeIcs(event.description.slice(0, 1000))}` : null,
    `URL:${event.source_url}`,
    "END:VEVENT"
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function eventsToIcsCalendar(events: EventRecord[], calendarName = "Campus Event Map") {
  const body = events.map(eventToIcs).join("\r\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `X-WR-CALNAME:${escapeIcs(calendarName)}`, "PRODID:-//Campus Event Map//EN", body, "END:VCALENDAR"].join(
    "\r\n"
  );
}

export function googleCalendarUrl(event: EventRecord) {
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.source_url,
    location: event.location_text ?? event.venue_name ?? ""
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
