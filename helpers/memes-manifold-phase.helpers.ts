import { mintPhaseWindowsForDay } from "@/shared/memes-calendar/phases";

const PHASE_IDS = new Map([
  ["phase0", "0"],
  ["phase1", "1"],
  ["phase2", "2"],
  ["publicphase", "public"],
  ["public", "public"],
]);

export function getMemePhaseIdForRootPhase(
  phase: string | null | undefined
): string | undefined {
  return PHASE_IDS.get((phase ?? "").replaceAll(/\s+/g, "").toLowerCase());
}

export function getMemesManifoldPhaseId({
  isPublic,
  merkleRoot,
  start,
  end,
  roots,
}: {
  readonly isPublic: boolean;
  readonly merkleRoot: string | undefined;
  readonly start: number;
  readonly end: number;
  readonly roots:
    | readonly {
        readonly merkle_root?: string | null;
        readonly phase?: string | null;
      }[]
    | null;
}): string | undefined {
  if (isPublic) return "public";

  const normalizedRoot = merkleRoot?.trim().toLowerCase();
  const root = roots?.find(
    (entry) => (entry.merkle_root ?? "").trim().toLowerCase() === normalizedRoot
  );
  const rootPhase = getMemePhaseIdForRootPhase(root?.phase);
  return (
    rootPhase ??
    mintPhaseWindowsForDay(new Date(start * 1000)).find(
      (phase) => phase.end.getTime() >= end * 1000
    )?.id
  );
}

export function isManifoldDropComplete(
  remaining: number,
  ended: boolean,
  hasNextPhase: boolean
): boolean {
  return remaining <= 0 || (ended && !hasNextPhase);
}
