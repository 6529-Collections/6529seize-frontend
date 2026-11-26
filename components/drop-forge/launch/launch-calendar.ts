import { Time } from "@/helpers/time";
import { buildMemesPhases, type MemePhase } from "@/hooks/useManifoldClaim";
import type { ApiDropForgePhase } from "@/generated/models/ApiDropForgePhase";

export function launchCalendarPhases(
  mintDate: Date,
  saved: readonly ApiDropForgePhase[] | null | undefined
): MemePhase[] {
  if (saved === undefined) return [];
  const defaults = buildMemesPhases(Time.millis(mintDate.getTime()));
  if (saved === null) return defaults;
  if (saved.length !== defaults.length) return [];
  return defaults.flatMap((phase, index) => {
    const window = saved[index];
    if (
      !window ||
      !Number.isSafeInteger(window.start) ||
      !Number.isSafeInteger(window.end) ||
      window.end <= window.start
    )
      return [];
    return [
      {
        ...phase,
        start: Time.seconds(window.start),
        end: Time.seconds(window.end),
      },
    ];
  });
}
