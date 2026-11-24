import type { ApiWave } from "@/generated/models/ApiWave";
import { resultTimesBetween } from "@/lib/waves-move/frozenResults";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const FREEZE = Date.UTC(2026, 10, 27);
const SWITCH_ON = Date.UTC(2026, 10, 28);

const waveWith = (
  first: number,
  steps: number[],
  rolling: boolean,
  extra: {
    readonly votingEnd?: number;
    readonly pauses?: { start_time: number; end_time: number }[];
  } = {}
): ApiWave =>
  ({
    wave: {
      decisions_strategy: {
        first_decision_time: first,
        subsequent_decisions: steps,
        is_rolling: rolling,
      },
    },
    voting: {
      period:
        extra.votingEnd === undefined
          ? null
          : { min: null, max: extra.votingEnd },
    },
    pauses: extra.pauses ?? [],
  }) as unknown as ApiWave;

// Monday, Wednesday and Friday at 16:00 UTC from Monday 3 November 2025.
const mainStage = (extra = {}) =>
  waveWith(Date.UTC(2025, 10, 3, 16), [2 * DAY, 2 * DAY, 3 * DAY], true, extra);

describe("resultTimesBetween", () => {
  it("finds a rolling schedule's result in the window, a year of rounds on", () => {
    expect(resultTimesBetween(mainStage(), FREEZE, SWITCH_ON)).toEqual([
      Date.UTC(2026, 10, 27, 16),
    ]);
    // Saturday has no result.
    expect(
      resultTimesBetween(mainStage(), SWITCH_ON, SWITCH_ON + DAY - 1)
    ).toEqual([]);
  });

  it("has none after the wave's voting end, or inside a decision pause", () => {
    expect(
      resultTimesBetween(
        mainStage({ votingEnd: FREEZE - DAY }),
        FREEZE,
        SWITCH_ON
      )
    ).toEqual([]);
    const pausedFriday = {
      pauses: [{ start_time: FREEZE, end_time: SWITCH_ON }],
    };
    expect(
      resultTimesBetween(mainStage(pausedFriday), FREEZE, SWITCH_ON)
    ).toEqual([]);
    // A pause's ends count as paused, as the site counts them.
    const endsAtTheResult = {
      pauses: [{ start_time: FREEZE, end_time: Date.UTC(2026, 10, 27, 16) }],
    };
    expect(
      resultTimesBetween(mainStage(endsAtTheResult), FREEZE, SWITCH_ON)
    ).toEqual([]);
    // A wave object without pauses pauses nothing, and doesn't throw.
    const { pauses: _pauses, ...withoutPauses } = mainStage();
    expect(
      resultTimesBetween(withoutPauses as ApiWave, FREEZE, SWITCH_ON)
    ).toEqual([Date.UTC(2026, 10, 27, 16)]);
  });

  it("walks a schedule that doesn't roll only as far as its steps go", () => {
    const finite = waveWith(FREEZE - DAY, [DAY + 2 * HOUR, DAY], false);
    expect(resultTimesBetween(finite, FREEZE, SWITCH_ON)).toEqual([
      FREEZE + 2 * HOUR,
    ]);
    expect(resultTimesBetween(finite, SWITCH_ON, SWITCH_ON + 7 * DAY)).toEqual([
      SWITCH_ON + 2 * HOUR,
    ]);
    expect(
      resultTimesBetween(finite, SWITCH_ON + DAY, SWITCH_ON + 7 * DAY)
    ).toEqual([]);
  });

  it("lists every result of a short cycle in the window", () => {
    const sixHourly = waveWith(FREEZE - 30 * DAY, [6 * HOUR], true);
    expect(resultTimesBetween(sixHourly, FREEZE, SWITCH_ON)).toEqual([
      FREEZE,
      FREEZE + 6 * HOUR,
      FREEZE + 12 * HOUR,
      FREEZE + 18 * HOUR,
      SWITCH_ON,
    ]);
  });

  it("has none without a schedule, before the first result, or with no steps", () => {
    expect(resultTimesBetween(null, FREEZE, SWITCH_ON)).toEqual([]);
    expect(resultTimesBetween(undefined, FREEZE, SWITCH_ON)).toEqual([]);
    expect(
      resultTimesBetween(
        { wave: { decisions_strategy: null } } as unknown as ApiWave,
        FREEZE,
        SWITCH_ON
      )
    ).toEqual([]);
    expect(
      resultTimesBetween(
        waveWith(SWITCH_ON + DAY, [DAY], true),
        FREEZE,
        SWITCH_ON
      )
    ).toEqual([]);
    expect(
      resultTimesBetween(waveWith(FREEZE - DAY, [], true), FREEZE, SWITCH_ON)
    ).toEqual([]);
    expect(
      resultTimesBetween(waveWith(FREEZE + HOUR, [], false), FREEZE, SWITCH_ON)
    ).toEqual([FREEZE + HOUR]);
  });
});
