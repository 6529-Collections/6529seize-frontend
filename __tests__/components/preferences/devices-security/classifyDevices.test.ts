import {
  classifyDevices,
  type ClassifyDevicesInput,
  type EncryptedDeviceInput,
  revokeScope,
} from "@/components/preferences/devices-security/classifyDevices";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";

const NOW = Date.UTC(2026, 10, 9, 15, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WALLET = "0x1111111111111111111111111111111111111111";

const grant = (
  id: string,
  patch: Partial<ApiDeviceGrant> = {}
): ApiDeviceGrant =>
  ({
    id,
    wallet: WALLET,
    key_type: "ed25519",
    device_key: `0x${id.padStart(64, "0")}`,
    scopes: ["post", "edit", "delete", "react"],
    device_label: "Brave on Windows",
    domain: "6529.io",
    issued_at: NOW - 10 * DAY,
    created_at: NOW - 10 * DAY,
    expires_at: NOW + 170 * DAY,
    revoked_at: null,
    last_used_at: null,
    ...patch,
  }) as ApiDeviceGrant;

const encrypted = (
  deviceKey: string,
  patch: Partial<EncryptedDeviceInput> = {}
): EncryptedDeviceInput => ({
  deviceKey,
  label: "Brave on Windows",
  platform: "web",
  createdAt: NOW - 10 * DAY,
  lastSeenAt: null,
  expiresAt: NOW + 170 * DAY,
  revokedAt: null,
  isThisDevice: false,
  verified: true,
  grantId: null,
  ...patch,
});

const classify = (input: Partial<ClassifyDevicesInput>) =>
  classifyDevices({
    grants: [],
    encryptedDevices: [],
    ownSigningKeys: [],
    now: NOW,
    ...input,
  });

describe("classifyDevices", () => {
  it("merges a combined grant and its encrypted-DMs device into one device", () => {
    const result = classify({
      grants: [grant("a", { last_used_at: NOW - 3 * HOUR })],
      encryptedDevices: [
        encrypted("e1", {
          grantId: "a",
          label: "My laptop",
          lastSeenAt: NOW - HOUR,
          expiresAt: NOW + 100 * DAY,
        }),
      ],
    });
    expect(result.otherDevices).toHaveLength(1);
    const [device] = result.otherDevices;
    expect(device).toMatchObject({
      id: "a",
      label: "My laptop",
      lastActiveAt: NOW - HOUR,
      expiresAt: NOW + 100 * DAY,
      signedPosts: { status: "active" },
      encryptedDms: { status: "active" },
      wallet: WALLET,
    });
  });

  it("keeps a signed-posts-only grant and an encrypted-only device apart", () => {
    const result = classify({
      grants: [grant("a")],
      encryptedDevices: [encrypted("e1", { label: "6529 app on iPhone" })],
    });
    expect(
      result.otherDevices.map(({ id, signedPosts, encryptedDms }) => [
        id,
        signedPosts?.status ?? null,
        encryptedDms?.status ?? null,
      ])
    ).toEqual(
      expect.arrayContaining([
        ["a", "active", null],
        ["e1", null, "active"],
      ])
    );
  });

  it("lists a second device claiming the same grant instead of dropping it", () => {
    const result = classify({
      grants: [grant("a")],
      encryptedDevices: [
        encrypted("e1", { grantId: "a" }),
        encrypted("e2", { grantId: "a", label: "Second claim" }),
      ],
    });
    expect(result.otherDevices.map(({ id }) => id).sort()).toEqual([
      "a",
      "e2",
    ]);
    expect(
      result.otherDevices.find(({ id }) => id === "a")?.encryptedDevice
        ?.deviceKey
    ).toBe("e1");
  });

  it("treats an encrypted device whose grant isn't listed as its own row", () => {
    const result = classify({
      encryptedDevices: [encrypted("e1", { grantId: "missing" })],
    });
    expect(result.otherDevices.map(({ id }) => id)).toEqual(["e1"]);
  });

  it.each([
    [
      "its signing key",
      { grants: [grant("a")], ownSigningKeys: [`0x${"a".padStart(64, "0")}`] },
    ],
    [
      "its encrypted-DMs device",
      { encryptedDevices: [encrypted("e1", { isThisDevice: true })] },
    ],
  ])("pins this device by %s", (_, input) => {
    const result = classify(input);
    expect(result.thisDevice).not.toBeNull();
    expect(result.otherDevices).toHaveLength(0);
  });

  it("knows this browser by its encryption device when no signing key matches", () => {
    // This browser's signing keys can't be read (or aren't its grant's), but
    // the engine knows the grant's encryption device is this browser's: it
    // is this device, so revoking it warns about backup and cleans up here.
    const result = classify({
      grants: [grant("a")],
      encryptedDevices: [encrypted("e1", { grantId: "a", isThisDevice: true })],
      ownSigningKeys: [],
    });
    expect(result.thisDevice?.id).toBe("a");
  });

  it("knows this browser's encrypted device by its stored key on the API list", () => {
    // No engine: the API list marks no device as this browser, and this
    // browser's signing keys can't be read. Its stored device key can.
    const result = classify({
      grants: [grant("a")],
      encryptedDevices: [encrypted("0xE1", { grantId: "a" })],
      ownSigningKeys: [],
      ownEncryptedDeviceKey: "0xe1",
    });
    expect(result.thisDevice?.id).toBe("a");
    expect(result.thisDevice?.encryptedDevice?.isThisDevice).toBe(true);
  });

  it("matches own signing keys case-insensitively", () => {
    const result = classify({
      grants: [grant("a", { device_key: `0x${"AB".repeat(32)}` })],
      ownSigningKeys: [`0x${"ab".repeat(32)}`],
    });
    expect(result.thisDevice?.id).toBe("a");
  });

  it("never pins an ended permission as this device", () => {
    const result = classify({
      grants: [grant("a", { revoked_at: NOW - DAY })],
      ownSigningKeys: [`0x${"a".padStart(64, "0")}`],
    });
    expect(result.thisDevice).toBeNull();
    expect(result.history.map(({ id }) => id)).toEqual(["a"]);
  });

  describe("earlier setups of this browser", () => {
    const thisDevice = encrypted("this", {
      isThisDevice: true,
      createdAt: NOW - 2 * HOUR,
    });

    it("groups same-name devices with no activity since this setup", () => {
      const result = classify({
        encryptedDevices: [
          thisDevice,
          encrypted("idle", {
            createdAt: NOW - 8 * DAY,
            lastSeenAt: NOW - 3 * HOUR,
          }),
          encrypted("never", { createdAt: NOW - DAY }),
        ],
      });
      expect(result.earlierSetups.map(({ id }) => id)).toEqual([
        "idle",
        "never",
      ]);
      expect(result.otherDevices).toHaveLength(0);
    });

    it("keeps a same-name device active since this setup among other devices", () => {
      const result = classify({
        encryptedDevices: [
          thisDevice,
          encrypted("twin", {
            createdAt: NOW - 8 * DAY,
            lastSeenAt: NOW - HOUR,
          }),
        ],
      });
      expect(result.earlierSetups).toHaveLength(0);
      expect(result.otherDevices.map(({ id }) => id)).toEqual(["twin"]);
    });

    it("keeps other names and later setups among other devices", () => {
      const result = classify({
        encryptedDevices: [
          thisDevice,
          encrypted("chrome", {
            label: "Chrome on Windows",
            createdAt: NOW - 8 * DAY,
          }),
          encrypted("newer", { createdAt: NOW - HOUR }),
        ],
      });
      expect(result.earlierSetups).toHaveLength(0);
      expect(result.otherDevices.map(({ id }) => id).sort()).toEqual([
        "chrome",
        "newer",
      ]);
    });

    it("pins this browser's encrypted device over a newer posts-only key, never as an earlier setup", () => {
      // This browser holds a newer signed-posts-only key with the same name,
      // and its stored encrypted device has been idle since that key was
      // set up. The encrypted device is still this browser's: it is the
      // card, and never pre-selected for clean-up.
      const result = classify({
        grants: [grant("posts", { created_at: NOW - HOUR })],
        encryptedDevices: [
          encrypted("0xE1", { createdAt: NOW - 8 * DAY, lastSeenAt: null }),
        ],
        ownSigningKeys: [`0x${"posts".padStart(64, "0")}`],
        ownEncryptedDeviceKey: "0xe1",
      });
      expect(result.thisDevice?.id).toBe("0xE1");
      expect(result.earlierSetups).toHaveLength(0);
      // The posts-only key is this browser's too: listed, not cleaned up.
      expect(result.otherDevices.map(({ id }) => id)).toEqual(["posts"]);
    });

    it("never offers another key this browser holds as an earlier setup", () => {
      const result = classify({
        grants: [
          grant("new", { created_at: NOW - HOUR }),
          grant("old", { created_at: NOW - 8 * DAY }),
        ],
        ownSigningKeys: [
          `0x${"new".padStart(64, "0")}`,
          `0x${"old".padStart(64, "0")}`,
        ],
      });
      expect(result.thisDevice?.id).toBe("new");
      expect(result.earlierSetups).toHaveLength(0);
      expect(result.otherDevices.map(({ id }) => id)).toEqual(["old"]);
    });

    it("has none without a this-device row", () => {
      const result = classify({
        encryptedDevices: [encrypted("idle", { createdAt: NOW - 8 * DAY })],
      });
      expect(result.earlierSetups).toHaveLength(0);
    });
  });

  describe("revokeScope", () => {
    const [row] = classify({
      grants: [grant("a")],
      encryptedDevices: [encrypted("0xE1", { grantId: "a" })],
    }).otherDevices;

    it("changes when the encrypted device is found to be this browser's", () => {
      const own = classify({
        grants: [grant("a")],
        encryptedDevices: [encrypted("0xE1", { grantId: "a" })],
        ownEncryptedDeviceKey: "0xe1",
      }).thisDevice;
      expect(revokeScope(own!)).not.toBe(revokeScope(row!));
    });

    it("changes when the grant links another encrypted device", () => {
      const [other] = classify({
        grants: [grant("a")],
        encryptedDevices: [encrypted("0xE2", { grantId: "a" })],
      }).otherDevices;
      expect(revokeScope(other!)).not.toBe(revokeScope(row!));
    });

    it("ignores the key's letter case", () => {
      const [upper] = classify({
        grants: [grant("a")],
        encryptedDevices: [encrypted("0xe1", { grantId: "a" })],
      }).otherDevices;
      expect(revokeScope(upper!)).toBe(revokeScope(row!));
    });
  });

  it("keeps a device active while any permission is", () => {
    const result = classify({
      grants: [grant("a", { revoked_at: NOW - DAY })],
      encryptedDevices: [encrypted("e1", { grantId: "a" })],
    });
    expect(result.otherDevices).toHaveLength(1);
    expect(result.otherDevices[0]).toMatchObject({
      signedPosts: { status: "revoked" },
      encryptedDms: { status: "active" },
      endedAt: null,
    });
  });

  it("lists ended devices of the last 30 days newest first and counts older ones", () => {
    const result = classify({
      grants: [
        grant("revoked-today", { revoked_at: NOW - HOUR }),
        grant("expired-last-week", { expires_at: NOW - 7 * DAY }),
        grant("revoked-long-ago", { revoked_at: NOW - 45 * DAY }),
      ],
    });
    expect(result.history.map(({ id }) => id)).toEqual([
      "revoked-today",
      "expired-last-week",
    ]);
    expect(result.history[1]?.signedPosts?.status).toBe("expired");
    expect(result.olderHistoryCount).toBe(1);
  });

  it("dates a fully ended combined device by its last permission to end", () => {
    const result = classify({
      grants: [grant("a", { revoked_at: NOW - 3 * DAY })],
      encryptedDevices: [
        encrypted("e1", { grantId: "a", revokedAt: NOW - DAY }),
      ],
    });
    expect(result.history[0]?.endedAt).toBe(NOW - DAY);
  });

  it("flags only a failed wallet-signature check", () => {
    const result = classify({
      encryptedDevices: [
        encrypted("ok"),
        encrypted("bad", { label: "Other", verified: false }),
      ],
    });
    const flags = Object.fromEntries(
      result.otherDevices.map(({ id, unverified }) => [id, unverified])
    );
    expect(flags).toEqual({ ok: false, bad: true });
  });
});
