import {
  getIdentityFreezeAtMs,
  getIdentityMovePhase,
  getIdentitySwitchOnMs,
  getNextIdentityMoveChangeMs,
  isIdentityEditingPaused,
  isIdentityEditingPausedPhase,
} from "@/lib/identity-move/schedule";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";

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
      };
    },
  };
});

const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

afterEach(() => {
  setIdentityFreezeAt(undefined);
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
