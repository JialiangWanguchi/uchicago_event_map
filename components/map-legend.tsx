import { MAP_LEGEND_ITEMS } from "@/lib/map-categories";

export function MapLegend() {
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Map legend</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {MAP_LEGEND_ITEMS.map((item) => (
          <div className="flex items-center gap-2 text-xs text-slate-700" key={item.label}>
            <span
              className={`inline-block h-3 w-3 rounded-full border border-white shadow-sm ${"pulse" in item && item.pulse ? "animate-pulse bg-red-500" : ""}`}
              style={"pulse" in item && item.pulse ? undefined : { backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
