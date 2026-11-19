import { publicEnv } from "@/config/env";
import {
  isE2eeReadSyncDebugShown,
  isE2eeReadSyncEnabled,
} from "@/config/e2eeReadSyncEnv";

jest.mock("@/config/env", () => ({ publicEnv: {} }));

/** The mocked env: BASE_ENDPOINT may be absent, as when it does not parse. */
const env = publicEnv as { BASE_ENDPOINT?: string | undefined };

describe("encrypted read-state sync flag (D175)", () => {
  beforeEach(() => {
    delete publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED;
    delete publicEnv.NEXT_PUBLIC_E2EE_READ_SYNC;
    delete env.BASE_ENDPOINT;
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

  describe("the staging-only debug row", () => {
    const readSyncOn = () => {
      publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED = "true";
      publicEnv.NEXT_PUBLIC_E2EE_READ_SYNC = "true";
    };

    it("shows on a staging build with read sync on", () => {
      readSyncOn();
      env.BASE_ENDPOINT = "https://staging.6529.io";
      expect(isE2eeReadSyncDebugShown()).toBe(true);
    });

    it("never shows on a production build", () => {
      readSyncOn();
      env.BASE_ENDPOINT = "https://6529.io";
      expect(isE2eeReadSyncDebugShown()).toBe(false);
      env.BASE_ENDPOINT = "https://www.6529.io";
      expect(isE2eeReadSyncDebugShown()).toBe(false);
      // An endpoint that does not parse counts as production.
      delete env.BASE_ENDPOINT;
      expect(isE2eeReadSyncDebugShown()).toBe(false);
    });

    it("stays hidden with read sync off", () => {
      publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED = "true";
      env.BASE_ENDPOINT = "https://staging.6529.io";
      expect(isE2eeReadSyncDebugShown()).toBe(false);
    });
  });
});
