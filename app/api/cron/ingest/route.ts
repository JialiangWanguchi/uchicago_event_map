import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ingestEvents } from "@/lib/data";
import { env } from "@/lib/env";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const headerSecret = request.headers.get("x-ingest-secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const allowed = [env.ingestSecret, env.cronSecret].filter(Boolean);
  if (allowed.length === 0) return false;
  return Boolean(
    (headerSecret && allowed.includes(headerSecret)) || (bearerSecret && allowed.includes(bearerSecret))
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const withEmbeddings = url.searchParams.get("embeddings") === "1";
    const result = await ingestEvents({ withEmbeddings });
    revalidatePath("/");
    revalidatePath("/saved");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[campus-event-map] ingest failed:", error);
    const message =
      error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
