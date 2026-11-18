/**
 * The lost-grant cleanup through the real API wrapper and its session-aware
 * fetch: each request must carry exactly the token validated as the account's
 * own, with no 401 retry that could swap in another session's token.
 */
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { writeDeviceGrantHint } from "@/lib/device-signing/grant-hint";
import {
  readDeviceKeyLoss,
  recordMissingDeviceKey,
} from "@/lib/device-signing/key-loss";

const ADDRESS = "0xabcdef0000000000000000000000000000000001";
const PROFILE = "profile-1";
const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const LOST_ID = `0x${"9".repeat(64)}`;
const NEW_ID = `0x${"8".repeat(64)}`;
const LOST_KEY = `0x${"cd".repeat(32)}`;
const NEW_KEY = `0x${"ef".repeat(32)}`;

/** The claims of the session token in use (cookie or stored session). */
let mockToken: { sub: string; role: string | null } | null = null;

/** An unsigned JWT with these claims; only its payload is ever read. */
function mockJwt(claims: object): string {
  const part = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "none", typ: "JWT" })}.${part(claims)}.signature`;
}

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => (mockToken === null ? null : mockJwt(mockToken)),
  getStagingAuth: () => null,
  // The stored account stays this wallet acting as itself throughout; only
  // the token in use (the cookie) changes under it.
  getWalletAddress: () => "0xabcdef0000000000000000000000000000000001",
  getWalletRole: () => null,
  // The stored session manages its own token, so the wrapper would retry.
  hasActiveSessionV2Auth: () => true,
  isAuthJwtUsable: () => true,
}));
jest.mock("@/services/auth/session-recovery-handler", () => ({
  recoverActiveSession: async () =>
    mockToken === null ? null : mockJwt(mockToken),
}));
jest.mock("@/services/auth/displayed-wallet-guard", () => ({
  assertWriteMatchesDisplayedWallet: () => undefined,
}));
jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  recordMobileLaunchApiRequest: () => undefined,
}));

const grant = (id: string, deviceKey: string): ApiDeviceGrant =>
  ({
    id,
    wallet: ADDRESS,
    device_key: deviceKey,
    scopes: ["post", "edit", "delete", "react"],
    expires_at: NOW + 100 * DAY,
    revoked_at: null,
  }) as ApiDeviceGrant;

jest.mock("@/lib/device-signing/device-key-store", () => ({
  readDeviceKey: async () => ({
    grant: {
      id: `0x${"8".repeat(64)}`,
      device_key: `0x${"ef".repeat(32)}`,
      revoked_at: null,
    },
  }),
  listLocalDevicePublicKeys: async () => [`0x${"ef".repeat(32)}`],
}));

import { revokeLostDeviceGrant } from "@/lib/device-signing/replace-lost-grant";

const DIRECT = { sub: ADDRESS, role: null };
const PROXY = { sub: ADDRESS, role: "proxy-profile" };

const reply = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: "",
  headers: new Headers(),
  json: async () => body,
  text: async () => (body === undefined ? "" : JSON.stringify(body)),
});

describe("lost-grant cleanup requests", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    mockToken = { ...DIRECT };
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const clock = jest.spyOn(Date, "now").mockReturnValue(NOW - DAY);
    writeDeviceGrantHint(ADDRESS, grant(LOST_ID, LOST_KEY), PROFILE);
    clock.mockRestore();
    recordMissingDeviceKey(ADDRESS, NOW);
  });

  const authorizationOf = (call: unknown[]) =>
    new Headers((call[1] as RequestInit | undefined)?.headers).get(
      "Authorization"
    );

  it("never retries with a proxy token, even when the cookie is direct again by the response", async () => {
    fetchMock
      .mockImplementationOnce(async () => {
        // Another tab moves this wallet to a proxy session meanwhile.
        mockToken = { ...PROXY };
        return reply(401, { error: "Unauthorized" });
      })
      .mockImplementationOnce(async () => {
        // A retry would carry the proxy token; the cookie is direct again
        // by the time its answer (the proxy's grants) arrives.
        mockToken = { ...DIRECT };
        return reply(200, [grant(`0x${"c".repeat(64)}`, NEW_KEY)]);
      });

    await expect(
      revokeLostDeviceGrant({ wallet: ADDRESS, profileId: PROFILE })
    ).resolves.toBe("failed");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(authorizationOf(fetchMock.mock.calls[0]!)).toBe(
      `Bearer ${mockJwt(DIRECT)}`
    );
    expect(readDeviceKeyLoss(ADDRESS)?.grantId).toBe(LOST_ID);
    expect(readDeviceKeyLoss(ADDRESS)?.revokeAttempts).toBeUndefined();
  });

  it("sends every cleanup request with the validated token, then revokes", async () => {
    fetchMock
      .mockResolvedValueOnce(
        reply(200, [grant(NEW_ID, NEW_KEY), grant(LOST_ID, LOST_KEY)])
      )
      .mockResolvedValueOnce(reply(200, { profile_id: PROFILE, devices: [] }))
      .mockResolvedValueOnce(reply(200, grant(LOST_ID, LOST_KEY)));

    await expect(
      revokeLostDeviceGrant({ wallet: ADDRESS, profileId: PROFILE })
    ).resolves.toBe("revoked");

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining("/api/device-grants"),
      expect.stringContaining("/api/e2ee/me"),
      expect.stringContaining(`/api/device-grants/${LOST_ID}/revoke`),
    ]);
    for (const call of fetchMock.mock.calls) {
      expect(authorizationOf(call)).toBe(`Bearer ${mockJwt(DIRECT)}`);
    }
    expect(readDeviceKeyLoss(ADDRESS)).toBeNull();
  });
});
