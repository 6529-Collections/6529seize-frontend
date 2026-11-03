import type { ApiWaveDecisionsStrategy } from "@/generated/models/ApiWaveDecisionsStrategy";
import type { UtcTimeOfDay } from "@/helpers/utc-schedule.helpers";

/** The part of a wave the checkpoint time is read from. Any ApiWave fits. */
interface WaveWithDecisionStrategy {
  readonly wave?:
    | {
        readonly decisions_strategy?:
          | Pick<ApiWaveDecisionsStrategy, "first_decision_time">
          | null
          | undefined;
      }
    | undefined;
}

/**
 * The Memes checkpoint is 16:00 UTC all year, so it is 17:00 in London only in
 * summer. Used when the wave does not say otherwise.
 */
export const MEMES_CHECKPOINT_UTC_TIME: UtcTimeOfDay = {
  hour: 16,
  minute: 0,
};

/** Monday, Wednesday and Friday (0 = Sunday), in UTC. */
export const MEMES_CHECKPOINT_UTC_WEEKDAYS: readonly number[] = [1, 3, 5];

/**
 * The UTC time of day at which the wave decides. Memes decisions are 48 or 72
 * hours apart, so each one falls at the time of day of the first decision.
 * Falls back to the Memes default when the wave is not loaded or has no usable
 * first decision.
 */
export function getCheckpointUtcTime(
  wave: WaveWithDecisionStrategy | null | undefined
): UtcTimeOfDay {
  const firstDecisionTime = wave?.wave?.decisions_strategy?.first_decision_time;
  if (
    typeof firstDecisionTime !== "number" ||
    !Number.isFinite(firstDecisionTime) ||
    firstDecisionTime <= 0
  ) {
    return MEMES_CHECKPOINT_UTC_TIME;
  }

  const firstDecision = new Date(firstDecisionTime);
  return {
    hour: firstDecision.getUTCHours(),
    minute: firstDecision.getUTCMinutes(),
  };
}
