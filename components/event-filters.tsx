"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/constants";

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

function parseDateParts(value: string | null) {
  if (!value) {
    return { year: "", month: "", day: "" };
  }

  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}

function buildDayOptions(year: string, month: string) {
  const totalDays = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

  return Array.from({ length: totalDays }, (_, index) => {
    const value = String(index + 1).padStart(2, "0");
    return { value, label: String(index + 1) };
  });
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 5 }, (_, index) => String(currentYear - 1 + index));
}

function clampDay(year: string, month: string, day: string) {
  if (!year || !month || !day) {
    return day;
  }

  const maxDay = new Date(Number(year), Number(month), 0).getDate();
  return String(Math.min(Number(day), maxDay)).padStart(2, "0");
}

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFrom = parseDateParts(searchParams.get("dateFrom"));
  const dateTo = parseDateParts(searchParams.get("dateTo"));
  const yearOptions = buildYearOptions();

  function updateDateParam(name: string, nextParts: { year: string; month: string; day: string }) {
    if (!nextParts.year && !nextParts.month && !nextParts.day) {
      updateParam(name, "");
      return;
    }

    if (nextParts.year && nextParts.month && nextParts.day) {
      updateParam(name, `${nextParts.year}-${nextParts.month}-${nextParts.day}`);
      return;
    }

    updateParam(name, "");
  }

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

  function renderDateControls(name: "dateFrom" | "dateTo", label: string, current: { year: string; month: string; day: string }) {
    const dayOptions = buildDayOptions(current.year, current.month);

    return (
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={current.month}
            aria-label={`${label} month`}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
            onChange={(event) =>
              updateDateParam(name, {
                ...current,
                month: event.target.value,
                day: clampDay(current.year, event.target.value, current.day)
              })
            }
          >
            <option value="">Month</option>
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={current.day}
            aria-label={`${label} day`}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
            onChange={(event) =>
              updateDateParam(name, {
                ...current,
                day: event.target.value
              })
            }
          >
            <option value="">Day</option>
            {dayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={current.year}
            aria-label={`${label} year`}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
            onChange={(event) =>
              updateDateParam(name, {
                ...current,
                year: event.target.value,
                day: clampDay(event.target.value, current.month, current.day)
              })
            }
          >
            <option value="">Year</option>
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.45fr)_minmax(0,1.45fr)_minmax(0,1fr)]">
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

        {renderDateControls("dateFrom", "Start date", dateFrom)}

        {renderDateControls("dateTo", "End date", dateTo)}

        <select
          defaultValue={searchParams.get("category") ?? ""}
          aria-label="Category"
          className="h-11 self-end rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
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
