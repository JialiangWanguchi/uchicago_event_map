import { NextResponse } from "next/server";
import { ingestEvents } from "@/lib/data";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const headerSecret = request.headers.get("x-ingest-secret");

  if (!env.ingestSecret || headerSecret !== env.ingestSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pages = Number(url.searchParams.get("pages") ?? 3);

  try {
    const result = await ingestEvents({ pages });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown ingestion error" },
      { status: 500 }
    );
  }
}
