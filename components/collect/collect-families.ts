import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { ApiCollectPlanningFamily } from "@/generated/models/ApiCollectPlanningFamily";

/** Marketplace-only families must not silently expand set or TDH planning. */
export const COLLECT_PLANNER_FAMILIES = [
  ApiCollectPlanningFamily.Memes,
  ApiCollectPlanningFamily.Gradients,
  ApiCollectPlanningFamily.Pebbles,
] as const;

/** Edition quantity behavior; execution separately validates the contract allowlist. */
export function isCollectEdition(
  family: ApiCollectFamily | undefined
): boolean {
  return (
    family === ApiCollectFamily.Memes || family === ApiCollectFamily.Memelab
  );
}
