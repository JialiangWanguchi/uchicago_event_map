import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { setSavedEvent } from "@/lib/data";

async function parseBody(request: Request) {
  const body = (await request.json()) as { eventId?: string };
  if (!body.eventId) {
    throw new Error("eventId is required");
  }
  return body;
}

export async function POST(request: Request) {
  return mutateSavedEvent(request, true);
}

export async function DELETE(request: Request) {
  return mutateSavedEvent(request, false);
}

async function mutateSavedEvent(request: Request, save: boolean) {
  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({ error: "Missing Supabase admin configuration" }, { status: 500 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { eventId } = (await parseBody(request)) as { eventId: string };
    await setSavedEvent(userId, eventId, save);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update saved event" },
      { status: 400 }
    );
  }
}
