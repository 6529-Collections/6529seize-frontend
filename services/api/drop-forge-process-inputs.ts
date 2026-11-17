import type { ApiDropForgeJob } from "@/generated/models/ApiDropForgeJob";

export function isForgeProcessTargetValid(
  claim: number,
  plan: string
): boolean {
  return Number.isSafeInteger(claim) && claim > 0 && plan.trim() !== "";
}

export type ForgePhaseInputs = {
  phaseIds: string[];
  missing: string[];
  duplicates: string[];
};

export function resolveForgePhaseInputs(
  phases: readonly { id: string; name: string }[]
): ForgePhaseInputs {
  const matches = phases.map((phase) => ({
    id: phase.id,
    index: phase.name
      .trim()
      .toLowerCase()
      .replace(/^(?:phase|p)\s*/, ""),
  }));
  const missing: string[] = [];
  const duplicates: string[] = [];
  const phaseIds = ["0", "1", "2"].flatMap((index) => {
    const matching = matches.filter((phase) => phase.index === index);
    if (matching.length === 0) missing.push(`Phase ${index}`);
    if (matching.length > 1) duplicates.push(`Phase ${index}`);
    return matching.length === 1 && matching[0] ? [matching[0].id] : [];
  });
  return { phaseIds, missing, duplicates };
}

export function getForgePhaseIds(
  phases: readonly { id: string; name: string }[]
): string[] {
  return resolveForgePhaseInputs(phases).phaseIds;
}
export function forgeProcessInputsMatch(
  job: ApiDropForgeJob | null | undefined,
  phaseIds: readonly string[]
): boolean {
  return (
    phaseIds.length === 3 &&
    job?.phase_ids?.length === 3 &&
    job.phase_ids.every((id, index) => id === phaseIds[index])
  );
}
