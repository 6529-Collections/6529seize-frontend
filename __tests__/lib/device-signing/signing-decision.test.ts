import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  readDeviceGrantHint,
  writeDeviceGrantHint,
} from "@/lib/device-signing/grant-hint";
import {
  getActiveSigningDecisionHost,
  getCurrentSigningDecision,
  registerSigningDecisionHost,
  requestSigningDecision,
  resolveSigningDecision,
  SigningDecisionUnavailableError,
  subscribeToSigningDecisions,
} from "@/lib/device-signing/signing-decision";

describe("signing decisions", () => {
  let unregister: () => void = () => undefined;
  beforeEach(() => {
    unregister = registerSigningDecisionHost("host-1");
  });
  afterEach(() => {
    for (
      let current = getCurrentSigningDecision();
      current;
      current = getCurrentSigningDecision()
    ) {
      resolveSigningDecision(current.id, "cancel");
    }
    unregister();
  });

  it("rejects when no host is mounted, so a write never goes unsigned silently", async () => {
    unregister();
    await expect(
      requestSigningDecision({ action: "post", reason: "timeout" })
    ).rejects.toBeInstanceOf(SigningDecisionUnavailableError);
    // Unregistering twice is harmless.
    unregister();
    unregister = registerSigningDecisionHost("host-1");
  });

  it("lets only the first host show prompts; later hosts stay inert", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const unregisterSecond = registerSigningDecisionHost("host-2");

    expect(getActiveSigningDecisionHost()).toBe("host-1");
    expect(warn).toHaveBeenCalledTimes(1);
    // The inert host's cleanup does not unregister the active one.
    unregisterSecond();
    expect(getActiveSigningDecisionHost()).toBe("host-1");

    // Registering the active host again (React StrictMode) is harmless.
    registerSigningDecisionHost("host-1");
    expect(warn).toHaveBeenCalledTimes(1);

    unregister();
    expect(getActiveSigningDecisionHost()).toBeNull();
    await expect(
      requestSigningDecision({ action: "react", reason: "timeout" })
    ).rejects.toBeInstanceOf(SigningDecisionUnavailableError);
    unregister = registerSigningDecisionHost("host-1");
    warn.mockRestore();
  });

  it("queues prompts in order with a stable snapshot and notifies listeners", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToSigningDecisions(listener);
    const first = requestSigningDecision({ action: "post", reason: "timeout" });
    const second = requestSigningDecision({ action: "react", reason: "lock" });

    const head = getCurrentSigningDecision();
    expect(head).toEqual(
      expect.objectContaining({ action: "post", reason: "timeout" })
    );
    expect(getCurrentSigningDecision()).toBe(head);
    expect(listener).toHaveBeenCalledTimes(2);

    resolveSigningDecision(head!.id, "retry");
    // Settling twice is ignored.
    resolveSigningDecision(head!.id, "unsigned");
    await expect(first).resolves.toBe("retry");
    expect(getCurrentSigningDecision()).toEqual(
      expect.objectContaining({ action: "react" })
    );

    resolveSigningDecision(getCurrentSigningDecision()!.id, "unsigned");
    await expect(second).resolves.toBe("unsigned");
    expect(getCurrentSigningDecision()).toBeNull();
    unsubscribe();
  });

  it("cancels on abort, including a signal that is already aborted", async () => {
    const controller = new AbortController();
    const pending = requestSigningDecision(
      { action: "delete", reason: "rejected" },
      controller.signal
    );
    controller.abort();
    await expect(pending).resolves.toBe("cancel");
    expect(getCurrentSigningDecision()).toBeNull();

    await expect(
      requestSigningDecision(
        { action: "delete", reason: "rejected" },
        controller.signal
      )
    ).resolves.toBe("cancel");
  });
});

describe("device grant hint", () => {
  const ADDRESS = "0xAbC0000000000000000000000000000000000001";
  const grant = {
    id: "grant-1",
    expires_at: 1_900_000_000_000,
    scopes: ["post", "react"],
  } as unknown as ApiDeviceGrant;

  beforeEach(() => globalThis.localStorage.clear());

  it("stores only the grant id, expiry, scopes and own profile id per wallet", () => {
    writeDeviceGrantHint(ADDRESS, grant, "profile-1");
    expect(readDeviceGrantHint(ADDRESS.toLowerCase())).toEqual({
      grantId: "grant-1",
      expiresAt: 1_900_000_000_000,
      scopes: ["post", "react"],
      ownProfileId: "profile-1",
    });
    writeDeviceGrantHint(ADDRESS, null, null);
    expect(readDeviceGrantHint(ADDRESS)).toBeNull();
  });

  it("ignores malformed notes", () => {
    const key = `6529-device-grant-hint:${ADDRESS.toLowerCase()}`;
    globalThis.localStorage.setItem(key, "{not json");
    expect(readDeviceGrantHint(ADDRESS)).toBeNull();
    globalThis.localStorage.setItem(key, JSON.stringify({ grantId: 1 }));
    expect(readDeviceGrantHint(ADDRESS)).toBeNull();
  });
});
