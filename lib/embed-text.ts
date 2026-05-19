import { createHash } from "crypto";
import type { EventRecord } from "@/types/event";

export function buildEmbeddingText(input: {
  title: string;
  summary?: string | null;
  description?: string | null;
  categories?: string[];
}) {
  const descriptionSnippet = (input.description ?? "").slice(0, 500);
  return [input.title, input.summary ?? "", descriptionSnippet, (input.categories ?? []).join(", ")]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function embeddingHash(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export function buildEmbeddingTextFromEvent(event: Pick<EventRecord, "title" | "summary" | "description" | "categories">) {
  return buildEmbeddingText(event);
}
