import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getSavedEvents } from "@/lib/data";
import { eventsToIcsCalendar } from "@/lib/ics";
import { hasSavedEventsConfig } from "@/lib/env";

export async function GET() {
  if (!hasSavedEventsConfig()) {
    return NextResponse.json({ error: "Saved events are not configured" }, { status: 500 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getSavedEvents(userId);
  const calendar = eventsToIcsCalendar(events, "My UChicago Saved Events");

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="saved-events.ics"'
    }
  });
}
