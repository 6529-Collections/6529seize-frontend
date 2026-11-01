import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type {
  RequestSignedMessagesGrant,
  SignedMessagesGrantResult,
} from "@/components/auth/authSignedMessagesGrant";
import type { E2eeEngine, E2eeEngineStatus } from "@/lib/e2ee/types";

let mockGrantPossible = true;
jest.mock("@/lib/device-signing/login-grant", () => ({
  isAnyDeviceGrantPossible: (role: string | null) =>
    role === null && mockGrantPossible,
}));

let mockStoredGrant: Partial<ApiDeviceGrant> | null = null;
jest.mock("@/lib/device-signing/device-key-store", () => ({
  readDeviceKey: async () =>
    mockStoredGrant === null ? null : { grant: mockStoredGrant },
}));

const mockRevoke = jest.fn(async (_grantId: string) => ({}));
jest.mock("@/services/api/device-grants-api", () => ({
  revokeDeviceGrant: (grantId: string) => mockRevoke(grantId),
}));

import { turnOnWithCombinedSignIn } from "@/components/e2ee/gate/e2eeCombinedTurnOn";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const OLD_GRANT_ID = `0x${"1".repeat(64)}`;
const NEW_GRANT_ID = `0x${"7".repeat(64)}`;

const combined = (
  e2ee: Partial<{ grantSaved: boolean; adopted: boolean }> = {}
): SignedMessagesGrantResult => ({
  success: true,
  e2ee: { grantId: NEW_GRANT_ID, grantSaved: true, adopted: true, ...e2ee },
});

const createEngine = ({
  needsNewDevice = true,
  settlesOn = "ready",
}: {
  readonly needsNewDevice?: boolean;
  readonly settlesOn?: E2eeEngineStatus;
} = {}) => {
  const engine = {
    needsNewDevice: jest.fn(async () => needsNewDevice),
    enrollWithLoginGrant: jest.fn(async () => settlesOn),
    enroll: jest.fn(async () => undefined),
  };
  return { engine, asEngine: engine as unknown as E2eeEngine };
};

const run = (
  asEngine: E2eeEngine,
  requestGrant: RequestSignedMessagesGrant | undefined
) =>
  turnOnWithCombinedSignIn({
    engine: asEngine,
    address: ADDRESS,
    requestGrant,
  });

describe("turn on encrypted messages with one combined sign-in (NC8)", () => {
  beforeEach(() => {
    mockGrantPossible = true;
    mockStoredGrant = {
      id: OLD_GRANT_ID,
      revoked_at: null,
      expires_at: Date.now() + 90 * 86_400_000,
    } as Partial<ApiDeviceGrant>;
    mockRevoke.mockClear();
  });

  it("grants both keys with the sign-in, registers the key and revokes the replaced grant", async () => {
    const { engine, asEngine } = createEngine();
    const requestGrant = jest.fn(async () => combined());

    await expect(run(asEngine, requestGrant)).resolves.toBe("done");

    expect(requestGrant).toHaveBeenCalledWith({
      silent: true,
      encryptedMessages: true,
    });
    expect(engine.enrollWithLoginGrant).toHaveBeenCalledTimes(1);
    expect(engine.enroll).not.toHaveBeenCalled();
    expect(mockRevoke).toHaveBeenCalledWith(OLD_GRANT_ID);
  });

  it("is done at the device limit too, which the gate then shows", async () => {
    const { asEngine } = createEngine({ settlesOn: "device-limit" });
    await expect(run(asEngine, async () => combined())).resolves.toBe("done");
  });

  it("changes nothing when the wallet declines", async () => {
    const { engine, asEngine } = createEngine();
    const requestGrant = jest.fn(
      async (): Promise<SignedMessagesGrantResult> => ({
        success: false,
        reason: "rejected",
      })
    );

    await expect(run(asEngine, requestGrant)).resolves.toBe("declined");

    expect(engine.enrollWithLoginGrant).not.toHaveBeenCalled();
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("stops when the wallet or network changes mid-way", async () => {
    const { asEngine } = createEngine();
    await expect(
      run(asEngine, async () => ({
        success: false,
        reason: "context-changed",
      }))
    ).resolves.toBe("stopped");
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it.each([
    "device-key",
    "challenge-mismatch",
    "challenge-failed",
    "signature-failed",
    "unavailable",
  ] as const)(
    "falls back to the grant prompt when the combined sign-in fails (%s)",
    async (reason) => {
      const { engine, asEngine } = createEngine();
      await expect(
        run(asEngine, async () => ({ success: false, reason }))
      ).resolves.toBe("fallback");
      expect(engine.enrollWithLoginGrant).not.toHaveBeenCalled();
      expect(mockRevoke).not.toHaveBeenCalled();
    }
  );

  it("falls back, keeping the new grant as the only one, when the key could not be stored", async () => {
    const { engine, asEngine } = createEngine();

    await expect(
      run(asEngine, async () => combined({ adopted: false }))
    ).resolves.toBe("fallback");

    expect(engine.enrollWithLoginGrant).not.toHaveBeenCalled();
    expect(mockRevoke).toHaveBeenCalledWith(OLD_GRANT_ID);
  });

  it("falls back when the server refuses the sign-in grant at registration", async () => {
    const { asEngine } = createEngine({ settlesOn: "needs-enrollment" });
    await expect(run(asEngine, async () => combined())).resolves.toBe(
      "fallback"
    );
  });

  it("keeps the old grant when the new one was not kept locally", async () => {
    const { asEngine } = createEngine();
    await run(asEngine, async () => combined({ grantSaved: false }));
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it.each([
    ["no stored grant", null],
    [
      "an already revoked grant",
      { id: OLD_GRANT_ID, revoked_at: 1, expires_at: Date.now() + 1e9 },
    ],
    [
      "an expired grant",
      { id: OLD_GRANT_ID, revoked_at: null, expires_at: Date.now() - 1 },
    ],
  ])("revokes nothing for %s", async (_label, stored) => {
    mockStoredGrant = stored as Partial<ApiDeviceGrant> | null;
    const { asEngine } = createEngine();
    await expect(run(asEngine, async () => combined())).resolves.toBe("done");
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("finishes even when revoking the replaced grant fails", async () => {
    mockRevoke.mockRejectedValueOnce(new Error("offline"));
    const { asEngine } = createEngine();
    await expect(run(asEngine, async () => combined())).resolves.toBe("done");
  });

  it("keeps the grant prompt where no combined grant is possible (proxies, apps with app grants off)", async () => {
    mockGrantPossible = false;
    const { asEngine } = createEngine();
    const requestGrant = jest.fn(async () => combined());

    await expect(run(asEngine, requestGrant)).resolves.toBe("fallback");
    expect(requestGrant).not.toHaveBeenCalled();
  });

  it("keeps the grant prompt outside the auth provider", async () => {
    const { asEngine } = createEngine();
    await expect(run(asEngine, undefined)).resolves.toBe("fallback");
  });

  it("lets enroll() resume or renew a stored device without a new grant", async () => {
    const { asEngine } = createEngine({ needsNewDevice: false });
    const requestGrant = jest.fn(async () => combined());

    await expect(run(asEngine, requestGrant)).resolves.toBe("fallback");
    expect(requestGrant).not.toHaveBeenCalled();
  });
});
