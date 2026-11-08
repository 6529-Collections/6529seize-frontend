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

/**
 * An engine with the real one's enrollment guard: the first
 * enrollWithLoginGrant() starts the registration and holds "enrolling" until
 * the test settles it; a call made meanwhile returns "enrolling" at once.
 */
const createRegisteringEngine = () => {
  let status: E2eeEngineStatus = "needs-enrollment";
  const listeners = new Set<() => void>();
  const setStatus = (next: E2eeEngineStatus) => {
    status = next;
    for (const listener of [...listeners]) listener();
  };
  let settle: (next: E2eeEngineStatus) => void = () => undefined;
  const engine = {
    needsNewDevice: jest.fn(async () => true),
    getStatus: () => status,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    enroll: jest.fn(async () => undefined),
    registrations: 0,
    enrollWithLoginGrant: jest.fn(async (): Promise<E2eeEngineStatus> => {
      if (status !== "needs-enrollment") return status;
      // The engine first re-reads the stored device on its serial queue.
      await Promise.resolve();
      if (status === "enrolling") return status;
      setStatus("enrolling");
      engine.registrations += 1;
      await new Promise<void>((resolve) => {
        settle = (next) => {
          setStatus(next);
          resolve();
        };
      });
      return status;
    }),
  };
  return {
    engine,
    asEngine: engine as unknown as E2eeEngine,
    settle: (next: E2eeEngineStatus) => settle(next),
    listenerCount: () => listeners.size,
  };
};

/**
 * Stands in for E2eeProvider: adopting the sign-in key dispatches a
 * same-tab "storage" event, and the provider resumes enrollment on it.
 */
const resumeOnStorageEvent = (engine: E2eeEngine) => {
  const resume = () => {
    if (engine.getStatus() === "needs-enrollment") {
      void engine.enrollWithLoginGrant();
    }
  };
  globalThis.addEventListener("storage", resume);
  return () => globalThis.removeEventListener("storage", resume);
};

const adoptingGrant = (
  result: SignedMessagesGrantResult = combined()
): RequestSignedMessagesGrant =>
  jest.fn(async () => {
    globalThis.dispatchEvent(new Event("storage"));
    return result;
  });

const run = (
  asEngine: E2eeEngine,
  requestGrant: RequestSignedMessagesGrant | undefined
) =>
  turnOnWithCombinedSignIn({
    engine: asEngine,
    address: ADDRESS,
    requestGrant,
  });

/** Lets pending promise chains run until `ready` holds (fake-timer safe). */
const waitUntil = async (ready: () => boolean): Promise<void> => {
  for (let turn = 0; turn < 50 && !ready(); turn += 1) {
    await Promise.resolve();
  }
  expect(ready()).toBe(true);
};

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

  it("reports partial setup, keeping the new grant as the only one, when the key could not be stored", async () => {
    const { engine, asEngine } = createEngine();

    await expect(
      run(asEngine, async () => combined({ adopted: false }))
    ).resolves.toBe("partial");

    expect(engine.enrollWithLoginGrant).not.toHaveBeenCalled();
    expect(mockRevoke).toHaveBeenCalledWith(OLD_GRANT_ID);
  });

  it("reports partial setup when the server refuses the sign-in grant at registration", async () => {
    const { asEngine } = createEngine({ settlesOn: "needs-enrollment" });
    await expect(run(asEngine, async () => combined())).resolves.toBe(
      "partial"
    );
  });

  describe("while the provider already registers the granted key", () => {
    let stopResuming: () => void = () => undefined;
    afterEach(() => {
      stopResuming();
      jest.useRealTimers();
    });

    it("waits for that registration and reports done, not a failure", async () => {
      const { engine, asEngine, settle, listenerCount } =
        createRegisteringEngine();
      stopResuming = resumeOnStorageEvent(asEngine);

      const outcome = run(asEngine, adoptingGrant());
      // The provider's call registers; the turn-on's own call meets it.
      await waitUntil(
        () => engine.enrollWithLoginGrant.mock.calls.length === 2
      );
      settle("ready");

      await expect(outcome).resolves.toBe("done");
      expect(engine.registrations).toBe(1);
      expect(listenerCount()).toBe(0);
    });

    it("is done at the device limit too", async () => {
      const { asEngine, settle, listenerCount } = createRegisteringEngine();
      stopResuming = resumeOnStorageEvent(asEngine);

      const outcome = run(asEngine, adoptingGrant());
      await waitUntil(() => listenerCount() > 0);
      settle("device-limit");

      await expect(outcome).resolves.toBe("done");
    });

    it("reports partial setup only when that registration fails", async () => {
      const { asEngine, settle, listenerCount } = createRegisteringEngine();
      stopResuming = resumeOnStorageEvent(asEngine);

      const outcome = run(asEngine, adoptingGrant());
      await waitUntil(() => listenerCount() > 0);
      settle("needs-enrollment");

      await expect(outcome).resolves.toBe("partial");
    });

    it("reports a neutral pending state when it is still running after the wait", async () => {
      jest.useFakeTimers();
      const { asEngine, listenerCount } = createRegisteringEngine();
      stopResuming = resumeOnStorageEvent(asEngine);

      const outcome = run(asEngine, adoptingGrant());
      await waitUntil(() => listenerCount() > 0);
      jest.advanceTimersByTime(20_000);

      await expect(outcome).resolves.toBe("pending");
      expect(listenerCount()).toBe(0);
    });

    it("offers separate setup when the grant was not kept and registration is still running", async () => {
      jest.useFakeTimers();
      const { asEngine, listenerCount } = createRegisteringEngine();
      stopResuming = resumeOnStorageEvent(asEngine);

      const outcome = run(
        asEngine,
        adoptingGrant(combined({ grantSaved: false }))
      );
      await waitUntil(() => listenerCount() > 0);
      jest.advanceTimersByTime(20_000);

      await expect(outcome).resolves.toBe("fallback");
    });
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
