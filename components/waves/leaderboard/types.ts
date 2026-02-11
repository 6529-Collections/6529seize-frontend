export type LeaderboardViewMode = "list" | "grid" | "grid_content_only";

export const isLeaderboardViewMode = (
  value: unknown
): value is LeaderboardViewMode =>
  value === "list" || value === "grid" || value === "grid_content_only";
