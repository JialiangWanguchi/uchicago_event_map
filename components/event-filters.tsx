"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type DateFilterName = "dateFrom" | "dateTo";

type CalendarFieldProps = {
  label: string;
  name: DateFilterName;
  value: string | null;
  onChange: (name: DateFilterName, value: string) => void;
};

function CalendarField({ label, name, value, onChange }: CalendarFieldProps) {
  const selectedDate = value ? parseISO(value) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate ?? new Date());

  const monthStart = startOfMonth(visibleMonth);
  const monthLabel = format(visibleMonth, "MMMM yyyy");
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 })
  });

  function selectDate(date: Date) {
    onChange(name, format(date, "yyyy-MM-dd"));
    setVisibleMonth(date);
    setIsOpen(false);
  }

  function clearDate() {
    onChange(name, "");
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-11 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition hover:border-slate-400 focus:border-brand-500"
      >
        <span className={cn("truncate", !selectedDate && "text-slate-500")}>
          {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
        </span>
        <CalendarDays className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-[18rem] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
              className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-slate-950">{monthLabel}</div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
              className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const inCurrentMonth = isSameMonth(day, visibleMonth);
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md text-sm transition",
                    inCurrentMonth ? "text-slate-800 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-50",
                    isToday(day) && !selected && "font-semibold text-brand-600",
                    selected && "bg-slate-950 text-white hover:bg-slate-900"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={clearDate}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
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

        <CalendarField
          name="dateFrom"
          label="Start date"
          value={searchParams.get("dateFrom")}
          onChange={updateParam}
        />

        <CalendarField
          name="dateTo"
          label="End date"
          value={searchParams.get("dateTo")}
          onChange={updateParam}
        />

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Category</div>
          <select
            defaultValue={searchParams.get("category") ?? ""}
            aria-label="Category"
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
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
      </div>
    </section>
  );
}
