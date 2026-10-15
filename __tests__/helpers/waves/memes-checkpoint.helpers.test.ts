import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getCheckpointUtcTime,
  MEMES_CHECKPOINT_UTC_TIME,
  MEMES_CHECKPOINT_UTC_WEEKDAYS,
} from "@/helpers/waves/memes-checkpoint.helpers";

const waveWithFirstDecision = (firstDecisionTime: number | undefined) =>
  ({
    wave: {
      decisions_strategy:
        firstDecisionTime === undefined
          ? undefined
          : {
              first_decision_time: firstDecisionTime,
              subsequent_decisions: [172_800_000, 172_800_000, 259_200_000],
              is_rolling: true,
            },
    },
  }) as unknown as ApiWave;

describe("memes checkpoint", () => {
  it("is 16:00 UTC on Monday, Wednesday and Friday by default", () => {
    expect(MEMES_CHECKPOINT_UTC_TIME).toEqual({ hour: 16, minute: 0 });
    expect(MEMES_CHECKPOINT_UTC_WEEKDAYS).toEqual([1, 3, 5]);
  });

  it("reads the live Memes schedule as 16:00 UTC", () => {
    // first_decision_time of the live Memes wave: 2025-03-31T16:00:00Z.
    expect(
      getCheckpointUtcTime(waveWithFirstDecision(Date.UTC(2025, 2, 31, 16)))
    ).toEqual({ hour: 16, minute: 0 });
  });

  it("keeps the UTC time of day in both seasons", () => {
    expect(
      getCheckpointUtcTime(waveWithFirstDecision(Date.UTC(2026, 0, 5, 16)))
    ).toEqual({ hour: 16, minute: 0 });
    expect(
      getCheckpointUtcTime(waveWithFirstDecision(Date.UTC(2026, 6, 6, 16)))
    ).toEqual({ hour: 16, minute: 0 });
  });

  it("derives the time from the wave when it differs", () => {
    expect(
      getCheckpointUtcTime(waveWithFirstDecision(Date.UTC(2026, 6, 6, 9, 30)))
    ).toEqual({ hour: 9, minute: 30 });
  });

  it.each([
    ["no wave", undefined],
    ["a wave without a strategy", waveWithFirstDecision(undefined)],
    ["a zero first decision", waveWithFirstDecision(0)],
    ["a non-finite first decision", waveWithFirstDecision(Number.NaN)],
    ["an empty object", {} as unknown as ApiWave],
  ])("falls back to 16:00 UTC for %s", (_label, wave) => {
    expect(getCheckpointUtcTime(wave)).toEqual(MEMES_CHECKPOINT_UTC_TIME);
  });
});
