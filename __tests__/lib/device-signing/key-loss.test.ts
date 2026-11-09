import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { writeDeviceGrantHint } from "@/lib/device-signing/grant-hint";
import {
  DEVICE_KEY_LOSS_EVENT,
  clearDeviceKeyLoss,
  readDeviceKeyLoss,
  recordMissingDeviceKey,
} from "@/lib/device-signing/key-loss";

const mockReadDeviceKey = jest.fn();
jest.mock("@/lib/device-signing/device-key-store", () => ({
  readDeviceKey: (...args: unknown[]) => mockReadDeviceKey(...args),
}));

const mockRevokeDeviceGrant = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  revokeDeviceGrant: (...args: unknown[]) => mockRevokeDeviceGrant(...args),
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
import { revokeLostDeviceGrant } from "@/lib/device-signing/replace-lost-grant";

const ADDRESS = "0xabcdef0000000000000000000000000000000001";
const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;
const LOST_ID = `0x${"9".repeat(64)}`;
const NEW_ID = `0x${"8".repeat(64)}`;

const grant = (id: string): ApiDeviceGrant =>
  ({
    id,
    wallet: ADDRESS,
    device_key: `0x${"cd".repeat(32)}`,
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
      mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID) });
      mockRevokeDeviceGrant.mockResolvedValue(grant(LOST_ID));

      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe(true);

      expect(mockRevokeDeviceGrant).toHaveBeenCalledTimes(1);
      expect(mockRevokeDeviceGrant).toHaveBeenCalledWith(LOST_ID);
      expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
      // Nothing is left to revoke on a later grant.
      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe(false);
      expect(mockRevokeDeviceGrant).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["no new grant yet", { grant: null }],
      ["the same grant", { grant: grant(LOST_ID) }],
      ["no record", null],
    ])("revokes nothing with %s and keeps the loss", async (_label, record) => {
      mockReadDeviceKey.mockResolvedValue(record);

      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe(false);

      expect(mockRevokeDeviceGrant).not.toHaveBeenCalled();
      expect(readDeviceKeyLoss(ADDRESS)?.grantId).toBe(LOST_ID);
    });

    it("never throws when the revoke fails", async () => {
      mockReadDeviceKey.mockResolvedValue({ grant: grant(NEW_ID) });
      mockRevokeDeviceGrant.mockRejectedValue(new Error("offline"));

      await expect(revokeLostDeviceGrant(ADDRESS)).resolves.toBe(false);
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
