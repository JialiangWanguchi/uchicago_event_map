export const MAP_CATEGORY_COLORS: Record<string, string> = {
  Academic: "#3b82f6",
  Arts: "#a855f7",
  Athletics: "#f97316",
  Social: "#10b981",
  Career: "#0ea5e9",
  Community: "#14b8a6",
  Workshop: "#eab308"
};

export const MAP_LEGEND_ITEMS = [
  { label: "Academic", color: MAP_CATEGORY_COLORS.Academic },
  { label: "Arts", color: MAP_CATEGORY_COLORS.Arts },
  { label: "Athletics", color: MAP_CATEGORY_COLORS.Athletics },
  { label: "Social", color: MAP_CATEGORY_COLORS.Social },
  { label: "Career", color: MAP_CATEGORY_COLORS.Career },
  { label: "Community", color: MAP_CATEGORY_COLORS.Community },
  { label: "Workshop", color: MAP_CATEGORY_COLORS.Workshop },
  { label: "Live now", color: "#ef4444", pulse: true },
  { label: "Other", color: "#64748b" }
] as const;

export const NEAR_ME_RADIUS_KM = 1.5;

export const MAP_CLUSTER_DISABLE_ZOOM = 16;

export function getCategoryColor(categories: string[]) {
  for (const category of categories) {
    if (MAP_CATEGORY_COLORS[category]) {
      return MAP_CATEGORY_COLORS[category];
    }
  }
  return "#64748b";
}
