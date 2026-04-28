"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  eventId: string;
  initiallySaved: boolean;
  enabled: boolean;
};

export function SaveButton({ eventId, initiallySaved, enabled }: Props) {
  const [saved, setSaved] = useState(initiallySaved);
  const [isPending, startTransition] = useTransition();

  async function toggle() {
    const nextSaved = !saved;
    setSaved(nextSaved);

    startTransition(async () => {
      const response = await fetch("/api/saved", {
        method: nextSaved ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ eventId })
      });

      if (!response.ok) {
        setSaved(!nextSaved);
      }
    });
  }

  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-400"
      >
        <Bookmark className="h-4 w-4" />
        Save
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition",
        saved
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
      )}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
