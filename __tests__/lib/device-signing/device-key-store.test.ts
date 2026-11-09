import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { StoredDeviceKey } from "@/lib/device-signing/device-key-storage";
import { installNodeWebCrypto } from "./device-signing-test-utils";

const mockRecords = new Map<string, StoredDeviceKey>();
jest.mock("@/lib/device-signing/device-key-storage", () => ({
  deviceKeyStorage: {
    read: async (address: string) => mockRecords.get(address),
    write: async (record: StoredDeviceKey) => {
      mockRecords.set(record.address, record);
    },
    readAll: async () => [...mockRecords.values()],
  },
}));

const mockRequestPersistentStorage = jest.fn(async () => undefined);
jest.mock("@/lib/storage/persistent-storage", () => ({
  requestPersistentStorage: () => mockRequestPersistentStorage(),
}));

const mockReportDeviceKeyLoss = jest.fn(async (_loss: unknown) => undefined);
jest.mock("@/lib/device-signing/key-loss-report", () => ({
  reportDeviceKeyLoss: (loss: unknown) => mockReportDeviceKeyLoss(loss),
}));

import {
  readDeviceGrantHint,
  writeDeviceGrantHint,
} from "@/lib/device-signing/grant-hint";
import { readDeviceKeyLoss } from "@/lib/device-signing/key-loss";
import {
  allocateDeviceSeq,
  ensureDeviceKey,
  forgetDeviceGrant,
  getDeviceGrantStatus,
  installSharedDeviceKey,
  listLocalDevicePublicKeys,
  readDeviceKey,
  readUsableDeviceGrant,
  saveDeviceGrant,
  subscribeToDeviceGrantChanges,
} from "@/lib/device-signing/device-key-store";

const ADDRESS = "0xAbCdEf0000000000000000000000000000000001";
const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

const grantFor = (
  deviceKey: string,
  overrides: Partial<ApiDeviceGrant> = {}
): ApiDeviceGrant =>
  ({
    id: `0x${"1".repeat(64)}`,
    wallet: ADDRESS.toLowerCase(),
    key_type: "ed25519",
    device_key: deviceKey,
    scopes: ["post", "edit", "delete", "react"],
    device_label: "Chrome on macOS",
    domain: "6529.io",
    issued_at: NOW,
    expires_at: NOW + 180 * DAY,
    created_at: NOW,
    revoked_at: null,
    last_used_at: null,
    ...overrides,
  }) as ApiDeviceGrant;

describe("device key store", () => {
  beforeAll(installNodeWebCrypto);
  beforeEach(() => {
    mockRecords.clear();
    mockRequestPersistentStorage.mockClear();
    mockReportDeviceKeyLoss.mockClear();
    localStorage.clear();
  });

  describe("a key store the browser dropped", () => {
    const LOST_GRANT = grantFor(`0x${"cd".repeat(32)}`, {
      id: `0x${"9".repeat(64)}`,
    });

    it("records this browser's lost grant before the warm-up read clears its note", async () => {
      writeDeviceGrantHint(ADDRESS.toLowerCase(), LOST_GRANT, "profile-1");

      await expect(readUsableDeviceGrant(ADDRESS, NOW)).resolves.toBeNull();

      expect(readDeviceGrantHint(ADDRESS)).toBeNull();
      expect(readDeviceKeyLoss(ADDRESS)).toMatchObject({
        grantId: LOST_GRANT.id,
        ownProfileId: "profile-1",
      });
      expect(mockReportDeviceKeyLoss).toHaveBeenCalledTimes(1);

      // Later reads, here or in the notice, never report it again.
      await readDeviceKey(ADDRESS);
      await ensureDeviceKey(ADDRESS);
      expect(mockReportDeviceKeyLoss).toHaveBeenCalledTimes(1);
    });

    it("never counts an expired grant on a key that is still here as a loss", async () => {
      const record = await ensureDeviceKey(ADDRESS);
      const expired = grantFor(record.publicKeyHex, { expires_at: NOW - DAY });
      await saveDeviceGrant(ADDRESS, expired);
      writeDeviceGrantHint(ADDRESS.toLowerCase(), expired, null);

      await expect(readUsableDeviceGrant(ADDRESS, NOW)).resolves.toBeNull();
      await readDeviceKey(ADDRESS);

      expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
      expect(mockReportDeviceKeyLoss).not.toHaveBeenCalled();
      expect(getDeviceGrantStatus(expired, NOW)).toBe("expired");
    });

    it("records nothing for a wallet this browser never held a grant for", async () => {
      await expect(readDeviceKey(ADDRESS)).resolves.toBeNull();
      await ensureDeviceKey(ADDRESS);

      expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
      expect(mockReportDeviceKeyLoss).not.toHaveBeenCalled();
    });

    it("asks to keep storage on every page that finds a stored key", async () => {
      await ensureDeviceKey(ADDRESS);
      expect(mockRequestPersistentStorage).not.toHaveBeenCalled();

      await readDeviceKey(ADDRESS);
      await readUsableDeviceGrant(ADDRESS, NOW);
      // Once per page in the helper itself; asked from each read here.
      expect(mockRequestPersistentStorage).toHaveBeenCalledTimes(2);
    });
  });

  it("creates one non-extractable key per lowercase wallet", async () => {
    const first = await ensureDeviceKey(ADDRESS);
    const second = await ensureDeviceKey(ADDRESS.toLowerCase());
    expect(second).toBe(first);
    expect(first.address).toBe(ADDRESS.toLowerCase());
    expect(first.publicKeyHex).toMatch(/^0x[0-9a-f]{64}$/);
    expect(first.keyPair.privateKey.extractable).toBe(false);
    expect(first.lastSeq).toBe(0);
    await expect(listLocalDevicePublicKeys()).resolves.toEqual([
      first.publicKeyHex,
    ]);
  });

  it("stores only a grant for this key and this wallet, then announces it", async () => {
    const record = await ensureDeviceKey(ADDRESS);
    const listener = jest.fn();
    const unsubscribe = subscribeToDeviceGrantChanges(listener);

    await expect(
      saveDeviceGrant(ADDRESS, grantFor(`0x${"ab".repeat(32)}`))
    ).resolves.toBe(false);
    await expect(
      saveDeviceGrant(
        ADDRESS,
        grantFor(record.publicKeyHex, { wallet: `0x${"2".repeat(40)}` })
      )
    ).resolves.toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(mockRequestPersistentStorage).not.toHaveBeenCalled();

    await expect(
      saveDeviceGrant(ADDRESS, grantFor(record.publicKeyHex))
    ).resolves.toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    // The key exists only in this browser: ask to keep its storage.
    expect(mockRequestPersistentStorage).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("announces when importing a shared key installs a new grant", async () => {
    const record = await ensureDeviceKey(ADDRESS);
    const grant = grantFor(record.publicKeyHex, {
      expires_at: Date.now() + DAY,
    });
    const listener = jest.fn();
    const unsubscribe = subscribeToDeviceGrantChanges(listener);

    try {
      await installSharedDeviceKey({ ...record, grant });
      expect(listener).toHaveBeenLastCalledWith({
        address: ADDRESS.toLowerCase(),
        saved: true,
      });
      await installSharedDeviceKey({ ...record, grant });
      expect(listener).toHaveBeenLastCalledWith({
        address: ADDRESS.toLowerCase(),
        saved: false,
      });
    } finally {
      unsubscribe();
    }
  });

  it("allocates max(lastSeq + 1, now) and persists it before signing", async () => {
    const record = await ensureDeviceKey(ADDRESS);
    await saveDeviceGrant(ADDRESS, grantFor(record.publicKeyHex));

    const first = await allocateDeviceSeq(ADDRESS, NOW);
    expect(first?.seq).toBe(NOW);
    expect(mockRecords.get(ADDRESS.toLowerCase())?.lastSeq).toBe(NOW);

    // Same millisecond (or a clock step back): still strictly increasing.
    const second = await allocateDeviceSeq(ADDRESS, NOW - 5_000);
    expect(second?.seq).toBe(NOW + 1);
    expect(mockRecords.get(ADDRESS.toLowerCase())?.lastSeq).toBe(NOW + 1);

    const later = await allocateDeviceSeq(ADDRESS, NOW + 10_000);
    expect(later?.seq).toBe(NOW + 10_000);
  });

  it("allocates nothing without a usable grant", async () => {
    await expect(allocateDeviceSeq(ADDRESS, NOW)).resolves.toBeNull();
    const record = await ensureDeviceKey(ADDRESS);
    await expect(allocateDeviceSeq(ADDRESS, NOW)).resolves.toBeNull();

    await saveDeviceGrant(
      ADDRESS,
      grantFor(record.publicKeyHex, { expires_at: NOW + 30_000 })
    );
    await expect(allocateDeviceSeq(ADDRESS, NOW)).resolves.toBeNull();

    await saveDeviceGrant(
      ADDRESS,
      grantFor(record.publicKeyHex, { revoked_at: NOW - 1 })
    );
    await expect(allocateDeviceSeq(ADDRESS, NOW)).resolves.toBeNull();
    expect(mockRecords.get(ADDRESS.toLowerCase())?.lastSeq).toBe(0);
  });

  it("forgets only the matching grant and keeps the key and sequence", async () => {
    const record = await ensureDeviceKey(ADDRESS);
    const grant = grantFor(record.publicKeyHex);
    await saveDeviceGrant(ADDRESS, grant);
    await allocateDeviceSeq(ADDRESS, NOW);

    await forgetDeviceGrant(ADDRESS, `0x${"9".repeat(64)}`);
    expect(mockRecords.get(ADDRESS.toLowerCase())?.grant).toEqual(grant);

    await forgetDeviceGrant(ADDRESS, grant.id);
    const stored = mockRecords.get(ADDRESS.toLowerCase());
    expect(stored?.grant).toBeNull();
    expect(stored?.lastSeq).toBe(NOW);
    expect(stored?.publicKeyHex).toBe(record.publicKeyHex);
  });

  it("classifies grants as none, active, renewal or expired", () => {
    const grant = grantFor(`0x${"ab".repeat(32)}`);
    expect(getDeviceGrantStatus(null, NOW)).toBe("none");
    expect(getDeviceGrantStatus(grant, NOW)).toBe("active");
    expect(getDeviceGrantStatus(grant, grant.expires_at - 14 * DAY)).toBe(
      "renewal"
    );
    expect(getDeviceGrantStatus(grant, grant.expires_at)).toBe("expired");
    expect(
      getDeviceGrantStatus({ ...grant, revoked_at: NOW } as ApiDeviceGrant, NOW)
    ).toBe("none");
    const { revoked_at: _missing, ...withoutRevokedAt } = grant;
    expect(
      getDeviceGrantStatus(withoutRevokedAt as unknown as ApiDeviceGrant, NOW)
    ).toBe("active");
  });
});
