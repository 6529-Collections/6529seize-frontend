import type { ApiWave } from "@/generated/models/ApiWave";
import { calculateLastDecisionTime } from "@/helpers/waves/time.utils";

/** The most result times walked for one wave, so no schedule stalls a render. */
const MAX_STEPS = 10_000;

/**
 * A wave's result times in [fromMs, toMs], ascending, as the site counts
 * them: the first decision, then each step in turn, the steps repeating when
 * the schedule rolls; none after the wave's last decision (its voting end),
 * and none inside a decision pause. While waves are frozen 6529.io settles
 * no result; the 6529 Network counts those after the switch-on.
 */
export function resultTimesBetween(
  wave: ApiWave | null | undefined,
  fromMs: number,
  toMs: number
): number[] {
  const strategy = wave?.wave.decisions_strategy;
  if (!wave || !strategy) {
    return [];
  }
  const untilMs = Math.min(toMs, calculateLastDecisionTime(wave));
  const steps = strategy.subsequent_decisions.filter((step) => step > 0);
  const rolling = strategy.is_rolling && steps.length > 0;
  let time = strategy.first_decision_time;
  // A rolling schedule repeats its steps: skip whole rounds before fromMs.
  const round = steps.reduce((sum, step) => sum + step, 0);
  if (rolling && time < fromMs - round) {
    time += Math.floor((fromMs - round - time) / round) * round;
  }
  // The API always sends pauses; a wave object without them pauses nothing.
  const pauses = Array.isArray(wave.pauses) ? wave.pauses : [];
  const paused = (at: number) =>
    pauses.some((pause) => at >= pause.start_time && at <= pause.end_time);
  const times: number[] = [];
  for (let index = 0; index <= MAX_STEPS && time <= untilMs; index += 1) {
    if (time >= fromMs && !paused(time)) {
      times.push(time);
    }
    const step = rolling ? steps[index % steps.length] : steps[index];
    if (step === undefined) {
      break;
    }
    time += step;
  }
  return times;
}
