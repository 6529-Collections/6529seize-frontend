import {
  getNextWavesMoveChangeMs,
  getWavesMovePhase,
  getWavesMoveSchedule,
  isWavesWritePaused,
  isWavesWritePausedPhase,
  parseWavesMoveInstant,
} from "@/lib/waves-move/schedule";
import {
  clearWavesFreeze,
  setWavesFreeze,
  setWavesFreezeSchedule,
  WAVES_FREEZE_MS,
  WAVES_SWITCH_ON_MS,
} from "@/__tests__/helpers/wavesFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __wavesFreeze?: object }).__wavesFreeze,
      };
    },
  };
});

const HOUR = 60 * 60 * 1000;

afterEach(() => {
  clearWavesFreeze();
});

describe("the instants", () => {
  it("reads UTC instants only", () => {
    expect(parseWavesMoveInstant("2026-11-25T00:00:00Z")).toBe(WAVES_FREEZE_MS);
    expect(parseWavesMoveInstant(" 2026-11-25T00:00Z ")).toBe(WAVES_FREEZE_MS);
  });

  it.each([
    undefined,
    null,
    "",
    "2026-11-25",
    "2026-11-25T00:00:00",
    "2026-11-25T00:00:00+01:00",
    "Wednesday",
    "2026-13-40T00:00:00Z",
  ])("ignores %p", (value) => {
    expect(parseWavesMoveInstant(value)).toBeNull();
  });

  it("is absent when either flag is unset", () => {
    expect(getWavesMoveSchedule()).toBeNull();
    setWavesFreeze("2026-11-25T00:00:00Z", undefined);
    expect(getWavesMoveSchedule()).toBeNull();
    setWavesFreeze(undefined, "2026-11-26T00:00:00Z");
    expect(getWavesMoveSchedule()).toBeNull();
    expect(isWavesWritePaused(WAVES_SWITCH_ON_MS + HOUR)).toBe(false);
  });

  it("is absent when the switch-on does not come after the freeze", () => {
    setWavesFreeze("2026-11-26T00:00:00Z", "2026-11-25T00:00:00Z");
    expect(getWavesMoveSchedule()).toBeNull();
    setWavesFreeze("2026-11-25T00:00:00Z", "2026-11-25T00:00:00Z");
    expect(getWavesMoveSchedule()).toBeNull();
  });

  it("reads the production schedule", () => {
    setWavesFreezeSchedule();
    expect(getWavesMoveSchedule()).toEqual({
      freezeAtMs: WAVES_FREEZE_MS,
      switchOnMs: WAVES_SWITCH_ON_MS,
    });
  });
});

describe("the phases", () => {
  const schedule = {
    freezeAtMs: WAVES_FREEZE_MS,
    switchOnMs: WAVES_SWITCH_ON_MS,
  };

  it("is none without a schedule", () => {
    expect(getWavesMovePhase(WAVES_FREEZE_MS, null)).toBe("none");
    expect(getNextWavesMoveChangeMs(WAVES_FREEZE_MS, null)).toBeNull();
  });

  it("gives notice until the freeze", () => {
    expect(getWavesMovePhase(WAVES_FREEZE_MS - 1, schedule)).toBe("notice");
    expect(getNextWavesMoveChangeMs(WAVES_FREEZE_MS - HOUR, schedule)).toBe(
      WAVES_FREEZE_MS
    );
  });

  it("freezes from the freeze instant until the switch-on", () => {
    expect(getWavesMovePhase(WAVES_FREEZE_MS, schedule)).toBe("frozen");
    expect(getWavesMovePhase(WAVES_SWITCH_ON_MS - 1, schedule)).toBe("frozen");
    expect(getNextWavesMoveChangeMs(WAVES_FREEZE_MS, schedule)).toBe(
      WAVES_SWITCH_ON_MS
    );
  });

  it("has moved from the switch-on and changes no more", () => {
    expect(getWavesMovePhase(WAVES_SWITCH_ON_MS, schedule)).toBe("moved");
    expect(getNextWavesMoveChangeMs(WAVES_SWITCH_ON_MS, schedule)).toBeNull();
  });

  it("pauses writes while frozen and after the move", () => {
    expect(isWavesWritePausedPhase("none")).toBe(false);
    expect(isWavesWritePausedPhase("notice")).toBe(false);
    expect(isWavesWritePausedPhase("frozen")).toBe(true);
    expect(isWavesWritePausedPhase("moved")).toBe(true);
  });

  it("follows the clock with the flags set", () => {
    setWavesFreezeSchedule();
    expect(isWavesWritePaused(WAVES_FREEZE_MS - 1)).toBe(false);
    expect(isWavesWritePaused(WAVES_FREEZE_MS)).toBe(true);
    expect(isWavesWritePaused(WAVES_SWITCH_ON_MS + HOUR)).toBe(true);
  });
});
