import type { ApiDropForgeJob } from "@/generated/models/ApiDropForgeJob";

export function getForgePhaseIds(
  phases: readonly { id: string; name: string }[]
): string[] {
  return [0, 1, 2].flatMap((index) => {
    const phase = phases.find(
      (item) =>
        item.name.replaceAll(/\s/g, "").toLowerCase() === `phase${index}`
    );
    return phase ? [phase.id] : [];
  });
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
