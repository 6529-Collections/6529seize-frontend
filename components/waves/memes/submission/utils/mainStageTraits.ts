import type { ApiMainStageTraitRule } from "@/generated/models/ApiMainStageTraitRule";
import type { TraitsData } from "../types/TraitsData";

/** Preview the same optional text values that the server applies at submission. */
export function applyMainStagePreviewDefaults(
  traits: TraitsData,
  rules: readonly ApiMainStageTraitRule[] | undefined
): TraitsData {
  if (!rules) return traits;
  const defaults: Record<string, string> = {};
  for (const rule of rules) {
    if (!Object.hasOwn(traits, rule.key) || rule.default_value !== "No")
      continue;
    const value = traits[rule.key as keyof TraitsData];
    if (typeof value === "string" && !value.trim()) {
      defaults[rule.key] = rule.default_value;
    }
  }
  return { ...traits, ...defaults };
}
