"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/constants";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    next.delete("page");
    router.push(`/?${next.toString()}`);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Search talks, workshops, venues"
            className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 outline-none transition focus:border-brand-500"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                updateParam("q", (event.target as HTMLInputElement).value);
              }
            }}
            onBlur={(event) => updateParam("q", event.target.value)}
          />
        </label>

        <input
          type="date"
          defaultValue={searchParams.get("dateFrom") ?? ""}
          className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
          onChange={(event) => updateParam("dateFrom", event.target.value)}
        />

        <input
          type="date"
          defaultValue={searchParams.get("dateTo") ?? ""}
          className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
          onChange={(event) => updateParam("dateTo", event.target.value)}
        />

        <select
          defaultValue={searchParams.get("category") ?? ""}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
          onChange={(event) => updateParam("category", event.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
