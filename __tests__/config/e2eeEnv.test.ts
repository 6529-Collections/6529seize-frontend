import { publicEnv } from "@/config/env";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { isE2eeFlagEnabled } from "@/config/e2eeFlag";

jest.mock("@/config/env", () => ({ publicEnv: {} }));

describe("encrypted messages flag", () => {
  beforeEach(() => {
    delete publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED;
  });

  it("is off when the flag is unset (production default)", () => {
    expect(isE2eeEnabled()).toBe(false);
  });

  it("is on only for the exact value true", () => {
    publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED = "true";
    expect(isE2eeEnabled()).toBe(true);
  });

  it.each(["false", "TRUE", "1", "yes", "on", " true", ""])(
    "stays off for %p",
    (value) => {
      publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED = value;
      expect(isE2eeEnabled()).toBe(false);
    }
  );

  it("treats non-string values as off", () => {
    expect(isE2eeFlagEnabled(true)).toBe(false);
    expect(isE2eeFlagEnabled(undefined)).toBe(false);
    expect(isE2eeFlagEnabled(null)).toBe(false);
  });
});
