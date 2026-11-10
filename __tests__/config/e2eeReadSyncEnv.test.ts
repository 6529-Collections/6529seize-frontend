import { publicEnv } from "@/config/env";
import { isE2eeReadSyncEnabled } from "@/config/e2eeReadSyncEnv";

jest.mock("@/config/env", () => ({ publicEnv: {} }));

describe("encrypted read-state sync flag (D175)", () => {
  beforeEach(() => {
    delete publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED;
    delete publicEnv.NEXT_PUBLIC_E2EE_READ_SYNC;
  });

  it("is off by default", () => {
    publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED = "true";
    expect(isE2eeReadSyncEnabled()).toBe(false);
  });

  it("is on only with encrypted messages on and the exact value true", () => {
    publicEnv.NEXT_PUBLIC_E2EE_READ_SYNC = "true";
    expect(isE2eeReadSyncEnabled()).toBe(false);
    publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED = "true";
    expect(isE2eeReadSyncEnabled()).toBe(true);
    publicEnv.NEXT_PUBLIC_E2EE_READ_SYNC = "TRUE";
    expect(isE2eeReadSyncEnabled()).toBe(false);
  });
});
