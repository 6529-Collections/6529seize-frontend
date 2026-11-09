import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { writeDeviceGrantHint } from "@/lib/device-signing/grant-hint";
import {
  DEVICE_KEY_LOSS_EVENT,
  clearDeviceKeyLoss,
  readDeviceKeyLoss,
  recordMissingDeviceKey,
} from "@/lib/device-signing/key-loss";

const mockReadDeviceKey = jest.fn();
const mockListLocalKeys = jest.fn();
jest.mock("@/lib/device-signing/device-key-store", () => ({
  readDeviceKey: (...args: unknown[]) => mockReadDeviceKey(...args),
  listLocalDevicePublicKeys: () => mockListLocalKeys(),
}));

const mockRevokeDeviceGrant = jest.fn();
const mockFetchDeviceGrants = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  revokeDeviceGrant: (...args: unknown[]) => mockRevokeDeviceGrant(...args),
  fetchDeviceGrants: () => mockFetchDeviceGrants(),
}));

jest.mock("@/services/api/common-api", () => ({
  getStructuredApiErrorStatus: (error: unknown) =>
    (error as { status?: number }).status,
}));

const mockReportDeviceKeyStoreLoss = jest.fn();
jest.mock("@/utils/monitoring/deviceSigningMonitoring", () => ({
  reportDeviceKeyStoreLoss: (...args: unknown[]) =>
    mockReportDeviceKeyStoreLoss(...args),
}));

let mockEnrolled = false;
jest.mock("@/components/e2ee/e2eeLocalState", () => ({
  hasE2eeEnrollmentMarker: () => mockEnrolled,
}));

let mockStoredDevice: unknown = null;
jest.mock("@/lib/e2ee/storage", () => ({
  getDefaultE2eeStorage: () => ({
    getDevice: async () => mockStoredDevice,
  }),
}));

import {
  bucketBytes,
  bucketHours,
  reportDeviceKeyLoss,
} from "@/lib/device-signing/key-loss-report";
import {
  MAX_LOST_GRANT_REVOKE_ATTEMPTS,
  revokeLostDeviceGrant,
} from "@/lib/device-signing/replace-lost-grant";

const ADDRESS = "0xabcdef0000000000000000000000000000000001";
const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;
const LOST_ID = `0x${"9".repeat(64)}`;
const NEW_ID = `0x${"8".repeat(64)}`;

const LOST_KEY = `0x${"cd".repeat(32)}`;
const NEW_KEY = `0x${"ef".repeat(32)}`;

const grant = (id: string, deviceKey = LOST_KEY): ApiDeviceGrant =>
  ({
    id,
    wallet: ADDRESS,
    device_key: deviceKey,
    scopes: ["post", "edit", "delete", "react"],
    expires_at: NOW + 100 * 24 * HOUR,
    revoked_at: null,
  }) as ApiDeviceGrant;

const writeHint = (writtenAt: number) => {
  const clock = jest.spyOn(Date, "now").mockReturnValue(writtenAt);
  writeDeviceGrantHint(ADDRESS, grant(LOST_ID), "profile-1");
  clock.mockRestore();
};

describe("device key loss", () => {
  beforeEach(() => {
    localStorage.clear();
    mockReadDeviceKey.mockReset();
    mockListLocalKeys.mockReset().mockResolvedValue([NEW_KEY]);
    mockFetchDeviceGrants
      .mockReset()
      .mockResolvedValue([grant(NEW_ID, NEW_KEY), grant(LOST_ID)]);
    mockRevokeDeviceGrant.mockReset();
    mockReportDeviceKeyStoreLoss.mockReset();
    mockEnrolled = false;
    mockStoredDevice = null;
  });

  it("records the lost grant from this browser's own note, once", () => {
    writeHint(NOW - 5 * HOUR);
    const changed = jest.fn();
    globalThis.addEventListener(DEVICE_KEY_LOSS_EVENT, changed);

    expect(recordMissingDeviceKey(ADDRESS, NOW)).toEqual({
      grantId: LOST_ID,
      ownProfileId: "profile-1",
      deviceKey: LOST_KEY,
      detectedAt: NOW,
      hintAgeHours: 5,
    });
    expect(recordMissingDeviceKey(ADDRESS, NOW + HOUR)).toBeNull();
    expect(readDeviceKeyLoss(ADDRESS.toUpperCase())?.grantId).toBe(LOST_ID);
    expect(changed).toHaveBeenCalledTimes(1);

    clearDeviceKeyLoss(ADDRESS);
    expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
    expect(changed).toHaveBeenCalledTimes(2);
    globalThis.removeEventListener(DEVICE_KEY_LOSS_EVENT, changed);
  });

  it("records nothing without a note, and an older note has no age", () => {
    expect(recordMissingDeviceKey(ADDRESS, NOW)).toBeNull();

    localStorage.setItem(
      `6529-device-grant-hint:${ADDRESS}`,
      JSON.stringify({
        grantId: LOST_ID,
        expiresAt: NOW + HOUR,
        scopes: ["post"],
        ownProfileId: null,
      })
    );
    expect(recordMissingDeviceKey(ADDRESS, NOW)?.hintAgeHours).toBeNull();
  });

  describe("revoking the lost grant after a new one", () => {
    beforeEach(() => {
      writeHint(NOW - HOUR);
      recordMissingDeviceKey(ADDRESS, NOW);
    });

    it("revokes exactly the grant this browser lost, then forgets it", async () => {
      mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID, NEW_KEY) });
      mockRevokeDeviceGrant.mockResolvedValue(grant(LOST_ID));

      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("revoked");

      expect(mockRevokeDeviceGrant).toHaveBeenCalledTimes(1);
      expect(mockRevokeDeviceGrant).toHaveBeenCalledWith(LOST_ID);
      expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
      // Nothing is left to revoke on a later grant.
      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("none");
      expect(mockRevokeDeviceGrant).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["no new grant yet", { grant: null }],
      ["the same grant", { grant: grant(LOST_ID) }],
      ["no record", null],
    ])("revokes nothing with %s and keeps the loss", async (_label, record) => {
      mockReadDeviceKey.mockResolvedValue(record);

      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("none");

      expect(mockRevokeDeviceGrant).not.toHaveBeenCalled();
      expect(readDeviceKeyLoss(ADDRESS)?.grantId).toBe(LOST_ID);
    });

    describe("revokes nothing, and drops the loss, unless the grant is verifiably this browser's lost one", () => {
      beforeEach(() => {
        mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID, NEW_KEY) });
      });

      const expectDroppedWithoutRevoke = async () => {
        await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("none");
        expect(mockRevokeDeviceGrant).not.toHaveBeenCalled();
        expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
      };

      it("when the server lists that grant for another key", async () => {
        mockFetchDeviceGrants.mockResolvedValue([
          grant(NEW_ID, NEW_KEY),
          grant(LOST_ID, `0x${"aa".repeat(32)}`),
        ]);
        await expectDroppedWithoutRevoke();
      });

      it("when the server no longer lists that grant", async () => {
        mockFetchDeviceGrants.mockResolvedValue([grant(NEW_ID, NEW_KEY)]);
        await expectDroppedWithoutRevoke();
      });

      it("when that grant is already revoked", async () => {
        mockFetchDeviceGrants.mockResolvedValue([
          grant(NEW_ID, NEW_KEY),
          { ...grant(LOST_ID), revoked_at: NOW },
        ]);
        await expectDroppedWithoutRevoke();
      });

      it("when another tab put that key back in this browser (a stale note)", async () => {
        mockListLocalKeys.mockResolvedValue([
          NEW_KEY,
          `0x${LOST_KEY.slice(2).toUpperCase()}`,
        ]);
        await expectDroppedWithoutRevoke();
      });

      it("when the note is older than the key it now records", async () => {
        localStorage.setItem(
          `6529-device-key-loss:${ADDRESS}`,
          JSON.stringify({
            grantId: LOST_ID,
            ownProfileId: null,
            detectedAt: NOW,
            hintAgeHours: null,
          })
        );
        await expectDroppedWithoutRevoke();
      });
    });

    it("counts a failed grant list as an attempt and keeps the loss", async () => {
      mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID, NEW_KEY) });
      mockFetchDeviceGrants.mockRejectedValue({ status: 503 });

      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("failed");
      expect(mockRevokeDeviceGrant).not.toHaveBeenCalled();
      expect(readDeviceKeyLoss(ADDRESS)?.revokeAttempts).toBe(1);
    });

    it("keeps the loss after a transient failure and gives up after the cap", async () => {
      mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID, NEW_KEY) });
      mockRevokeDeviceGrant.mockRejectedValue(new Error("offline"));

      for (let attempt = 1; attempt < MAX_LOST_GRANT_REVOKE_ATTEMPTS; attempt++) {
        await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("failed");
        expect(readDeviceKeyLoss(ADDRESS)?.revokeAttempts).toBe(attempt);
      }
      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("failed");
      expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
      expect(mockRevokeDeviceGrant).toHaveBeenCalledTimes(
        MAX_LOST_GRANT_REVOKE_ATTEMPTS
      );
    });

    it("retries a transient failure, then forgets the loss once revoked", async () => {
      mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID, NEW_KEY) });
      mockRevokeDeviceGrant
        .mockRejectedValueOnce({ status: 503 })
        .mockResolvedValueOnce(grant(LOST_ID));

      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("failed");
      expect(readDeviceKeyLoss(ADDRESS)?.grantId).toBe(LOST_ID);
      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("revoked");
      expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
    });

    it("stops at once on a permanent 4xx", async () => {
      mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID, NEW_KEY) });
      mockRevokeDeviceGrant.mockRejectedValue({ status: 404 });

      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("failed");
      expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe("none");
      expect(mockRevokeDeviceGrant).toHaveBeenCalledTimes(1);
    });

    it("revokes once when two tabs try at the same time", async () => {
      // Web Locks, as in the browser: one holder per name at a time.
      const queues = new Map<string, Promise<unknown>>();
      Object.defineProperty(globalThis.navigator, "locks", {
        configurable: true,
        value: {
          request: (name: string, task: () => Promise<unknown>) => {
            const run = (queues.get(name) ?? Promise.resolve()).then(task);
            queues.set(name, run.catch(() => undefined));
            return run;
          },
        },
      });
      try {
        mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID, NEW_KEY) });
        mockRevokeDeviceGrant.mockResolvedValue(grant(LOST_ID));

        const results = await Promise.all([
          revokeLostDeviceGrant(ADDRESS),
          revokeLostDeviceGrant(ADDRESS.toUpperCase().replace("0X", "0x")),
        ]);

        expect(results.sort()).toEqual(["none", "revoked"]);
        expect(mockRevokeDeviceGrant).toHaveBeenCalledTimes(1);
      } finally {
        delete (globalThis.navigator as { locks?: unknown }).locks;
      }
    });
  });

  describe("reporting a loss", () => {
    const setStorage = (storage: unknown) =>
      Object.defineProperty(globalThis.navigator, "storage", {
        configurable: true,
        value: storage,
      });
    afterEach(() => {
      delete (globalThis.navigator as { storage?: unknown }).storage;
    });

    it("sends only coarse codes", async () => {
      setStorage({
        persisted: async () => false,
        estimate: async () => ({ usage: 3 * 1024 * 1024, quota: 5e11 }),
      });
      localStorage.setItem("6529-storage-persistence", "denied");
      mockEnrolled = true;

      await reportDeviceKeyLoss({
        grantId: LOST_ID,
        ownProfileId: "profile-1",
        detectedAt: NOW,
        hintAgeHours: 30,
      });

      expect(mockReportDeviceKeyStoreLoss).toHaveBeenCalledWith({
        browser: expect.any(String),
        persisted: "denied",
        persistedBefore: "denied",
        usage: "1-10MB",
        quota: ">=10GB",
        encryptedStore: "empty",
        hintAge: "1-7d",
      });
      const sent = JSON.stringify(mockReportDeviceKeyStoreLoss.mock.calls);
      expect(sent).not.toContain(LOST_ID);
      expect(sent).not.toContain("profile-1");
    });

    it("tells an encrypted store that survived from one never set up", async () => {
      setStorage(undefined);
      mockEnrolled = true;
      mockStoredDevice = { profileId: "profile-1" };
      await reportDeviceKeyLoss({
        grantId: LOST_ID,
        ownProfileId: "profile-1",
        detectedAt: NOW,
        hintAgeHours: null,
      });
      mockEnrolled = false;
      await reportDeviceKeyLoss({
        grantId: LOST_ID,
        ownProfileId: "profile-1",
        detectedAt: NOW,
        hintAgeHours: null,
      });

      expect(
        mockReportDeviceKeyStoreLoss.mock.calls.map(
          ([report]) => (report as { encryptedStore: string }).encryptedStore
        )
      ).toEqual(["present", "not-enrolled"]);
      expect(mockReportDeviceKeyStoreLoss.mock.calls[0]?.[0]).toMatchObject({
        persisted: "unsupported",
        usage: "unknown",
        hintAge: "unknown",
      });
    });

    it("buckets sizes and ages", () => {
      expect(bucketBytes(undefined)).toBe("unknown");
      expect(bucketBytes(512)).toBe("<1MB");
      expect(bucketBytes(200 * 1024 * 1024)).toBe("100MB-1GB");
      expect(bucketHours(0)).toBe("<1h");
      expect(bucketHours(5)).toBe("1-24h");
      expect(bucketHours(24 * 8)).toBe(">=7d");
    });
  });
});
