import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ingestEvents } from "@/lib/data";
import { env } from "@/lib/env";

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
    const result = await ingestEvents();
    revalidatePath("/");
    revalidatePath("/saved");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown ingestion error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
