import {
  getIdentityFreezeAtMs,
  getIdentityMovePhase,
  getIdentitySwitchOnMs,
  getNextIdentityMoveChangeMs,
  isIdentityEditingPaused,
  isIdentityEditingPausedPhase,
} from "@/lib/identity-move/schedule";
import {
  setIdentityFreezeAt,
  setIdentitySwitchOnAt,
} from "@/__tests__/helpers/identityFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        NEXT_PUBLIC_IDENTITY_FREEZE_AT: (
          globalThis as { __identityFreezeAt?: string }
        ).__identityFreezeAt,
        NEXT_PUBLIC_IDENTITY_SWITCH_ON_AT: (
          globalThis as { __identitySwitchOnAt?: string }
        ).__identitySwitchOnAt,
      };
    },
  };
});

const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

afterEach(() => {
  setIdentityFreezeAt(undefined);
  setIdentitySwitchOnAt(undefined);
});

describe("the freeze instant", () => {
  it("is absent when the flag is unset", () => {
    expect(getIdentityFreezeAtMs()).toBeNull();
    expect(isIdentityEditingPaused(FREEZE + DAY * 10)).toBe(false);
  });

  it("reads a UTC instant", () => {
    setIdentityFreezeAt("2026-11-24T00:00:00Z");
    expect(getIdentityFreezeAtMs()).toBe(FREEZE);
    setIdentityFreezeAt(" 2026-11-24T00:00Z ");
    expect(getIdentityFreezeAtMs()).toBe(FREEZE);
  });

  it.each([
    "",
    "2026-11-24",
    "2026-11-24T00:00:00",
    "2026-11-24T00:00:00+01:00",
    "Tuesday",
    "2026-13-40T00:00:00Z",
  ])("ignores %p", (value) => {
    setIdentityFreezeAt(value);
    expect(getIdentityFreezeAtMs()).toBeNull();
  });
});

describe("the phases", () => {
  it("is none without a freeze", () => {
    expect(getIdentityMovePhase(FREEZE, null)).toBe("none");
    expect(getNextIdentityMoveChangeMs(FREEZE, null)).toBeNull();
  });

  it("gives notice before the freeze", () => {
    expect(getIdentityMovePhase(FREEZE - 1, FREEZE)).toBe("notice");
    expect(getNextIdentityMoveChangeMs(FREEZE - 1, FREEZE)).toBe(FREEZE);
  });

  it("is frozen for the 24 hours from the freeze", () => {
    expect(getIdentityMovePhase(FREEZE, FREEZE)).toBe("frozen");
    expect(getIdentityMovePhase(FREEZE + DAY - 1, FREEZE)).toBe("frozen");
    expect(getNextIdentityMoveChangeMs(FREEZE, FREEZE)).toBe(FREEZE + DAY);
    expect(getIdentitySwitchOnMs(FREEZE)).toBe(FREEZE + DAY);
  });

  it("has moved from the switch-on, and stays so", () => {
    expect(getIdentityMovePhase(FREEZE + DAY, FREEZE)).toBe("moved");
    expect(getNextIdentityMoveChangeMs(FREEZE + DAY, FREEZE)).toBeNull();
  });

  it("closes editing from the freeze on", () => {
    expect(isIdentityEditingPausedPhase("none")).toBe(false);
    expect(isIdentityEditingPausedPhase("notice")).toBe(false);
    expect(isIdentityEditingPausedPhase("frozen")).toBe(true);
    expect(isIdentityEditingPausedPhase("moved")).toBe(true);

    setIdentityFreezeAt("2026-11-24T00:00:00Z");
    expect(isIdentityEditingPaused(FREEZE - 1)).toBe(false);
    expect(isIdentityEditingPaused(FREEZE)).toBe(true);
    expect(isIdentityEditingPaused(FREEZE + DAY * 30)).toBe(true);
  });
});

describe("a later switch-on", () => {
  const WED = Date.UTC(2026, 10, 25, 0, 0, 0);
  const FRI = Date.UTC(2026, 10, 27, 0, 0, 0);

  it("is the freeze plus 24 hours when unset", () => {
    expect(getIdentitySwitchOnMs(WED)).toBe(WED + DAY);
  });

  it("follows the setting, and the freeze lasts until then", () => {
    setIdentitySwitchOnAt("2026-11-27T00:00:00Z");
    expect(getIdentitySwitchOnMs(WED)).toBe(FRI);
    expect(getIdentityMovePhase(WED - 1, WED)).toBe("notice");
    expect(getIdentityMovePhase(WED, WED)).toBe("frozen");
    expect(getIdentityMovePhase(WED + DAY, WED)).toBe("frozen");
    expect(getIdentityMovePhase(FRI - 1, WED)).toBe("frozen");
    expect(getIdentityMovePhase(FRI, WED)).toBe("moved");
    expect(getNextIdentityMoveChangeMs(WED - 1, WED)).toBe(WED);
    expect(getNextIdentityMoveChangeMs(WED + DAY, WED)).toBe(FRI);
    expect(getNextIdentityMoveChangeMs(FRI, WED)).toBeNull();

    setIdentityFreezeAt("2026-11-25T00:00:00Z");
    expect(isIdentityEditingPaused(WED + DAY)).toBe(true);
  });

  it.each([
    "",
    "Friday",
    "2026-11-27",
    "2026-11-27T00:00:00",
    "2026-11-27T00:00:00+01:00",
    "2026-13-40T00:00:00Z",
    "2026-11-31T00:00:00Z",
    "2026-11-26T24:00:00Z",
  ])("never comes sooner than the freeze plus 24 hours for %p", (value) => {
    setIdentitySwitchOnAt(value);
    expect(getIdentitySwitchOnMs(WED)).toBe(WED + DAY);
    expect(getIdentityMovePhase(WED + DAY, WED)).toBe("moved");
  });

  it.each([
    ["before the freeze", "2026-11-24T00:00:00Z"],
    ["at the freeze", "2026-11-25T00:00:00Z"],
    ["an hour after the freeze", "2026-11-25T01:00:00Z"],
    ["a minute short of a day", "2026-11-25T23:59:00Z"],
    ["exactly a day after", "2026-11-26T00:00:00Z"],
  ])("ignores a switch-on %s", (_label, value) => {
    setIdentitySwitchOnAt(value);
    expect(getIdentitySwitchOnMs(WED)).toBe(WED + DAY);
    expect(getIdentityMovePhase(WED + DAY - 1, WED)).toBe("frozen");
  });
});
