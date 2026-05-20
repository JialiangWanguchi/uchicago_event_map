"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, LocateFixed, Search } from "lucide-react";
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
import { NEAR_ME_DISTANCE_OPTIONS } from "@/lib/map-categories";
import { useMapLocation } from "@/components/map-location-context";
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
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[9999] w-[18rem] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth((month) => subMonths(month, 1))} className="rounded-md p-2 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold">{monthLabel}</div>
            <button type="button" aria-label="Next month" onClick={() => setVisibleMonth((month) => addMonths(month, 1))} className="rounded-md p-2 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => selectDate(day)}
                className={cn(
                  "flex h-9 items-center justify-center rounded-md text-sm",
                  isSameMonth(day, visibleMonth) ? "text-slate-800 hover:bg-slate-100" : "text-slate-300",
                  isToday(day) && "font-semibold text-brand-600",
                  selectedDate && isSameDay(day, selectedDate) && "bg-slate-950 text-white"
                )}
              >
                {format(day, "d")}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onChange(name, "")} className="mt-3 text-sm text-slate-600 hover:text-slate-950">
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const { nearMeActive, nearMeRadiusKm, setNearMeActive, setNearMeDistance, userLocation, locationLoading } =
    useMapLocation();

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (searchValue === current) return;
      updateParams({ q: searchValue });
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  function updateParams(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    router.push(`/?${next.toString()}`);
  }

  function toggleNearMe() {
    setNearMeActive(!nearMeActive);
  }

  return (
    <section className="relative z-[100] rounded-lg border border-slate-200 bg-white p-4 shadow-panel space-y-4">
      <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        <label>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Search</div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchValue}
              placeholder="Search talks, workshops, venues"
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500"
              onChange={(event) => setSearchValue(event.target.value)}
              aria-label="Search events"
            />
          </div>
        </label>

        <CalendarField name="dateFrom" label="Start date" value={searchParams.get("dateFrom")} onChange={(name, value) => updateParams({ [name]: value || undefined })} />
        <CalendarField name="dateTo" label="End date" value={searchParams.get("dateTo")} onChange={(name, value) => updateParams({ [name]: value || undefined })} />

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Category</div>
          <select
            defaultValue={searchParams.get("category") ?? ""}
            aria-label="Category"
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
            onChange={(event) => updateParams({ category: event.target.value || undefined })}
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateParams({ showEnded: searchParams.get("showEnded") === "1" ? undefined : "1" })}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium",
            searchParams.get("showEnded") === "1" ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-700"
          )}
        >
          Ended on map
        </button>
        <button
          type="button"
          onClick={toggleNearMe}
          disabled={locationLoading && !userLocation}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium",
            nearMeActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700",
            locationLoading && !userLocation && "opacity-60"
          )}
        >
          <LocateFixed className="h-4 w-4" />
          Near me {nearMeActive ? "(on)" : ""}
        </button>
        {nearMeActive ? (
          <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
            <span className="font-medium">Within</span>
            <select
              aria-label="Near me distance"
              value={nearMeRadiusKm}
              onChange={(event) => setNearMeDistance(Number(event.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-sm outline-none focus:border-brand-500"
            >
              {NEAR_ME_DISTANCE_OPTIONS.map((option) => (
                <option key={option.km} value={option.km}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </section>
  );
}
