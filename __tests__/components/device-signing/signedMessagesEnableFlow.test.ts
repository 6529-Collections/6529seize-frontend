import type {
  SignedMessagesGrantOptions,
  SignedMessagesGrantResult,
} from "@/components/auth/authSignedMessagesGrant";
import {
  isReconnectStatus,
  RECONNECT_WAIT_MS,
  REMOTE_WALLET_STALL_MS,
  SignedMessagesEnableFlow,
  SLOW_WALLET_HINT_MS,
  WRONG_ACCOUNT_RESUME_MS,
  type SignedMessagesEnableSnapshot,
  type SignedMessagesEnableStatus,
} from "@/components/device-signing/signedMessagesEnableFlow";

const ADDRESS = "0xAbCdEf0000000000000000000000000000001234";

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** Lets pending promise callbacks run. */
const flush = async () => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
};

function createHarness(overrides: Partial<SignedMessagesEnableSnapshot> = {}) {
  const statuses: (SignedMessagesEnableStatus | null)[] = [];
  const busy: boolean[] = [];
  const report = jest.fn();
  const grants: {
    readonly options: SignedMessagesGrantOptions | undefined;
    readonly result: Deferred<SignedMessagesGrantResult>;
  }[] = [];
  const requestGrant = jest.fn((options?: SignedMessagesGrantOptions) => {
    const result = deferred<SignedMessagesGrantResult>();
    grants.push({ options, result });
    return result.promise;
  });
  const onEnabled = jest.fn();
  const connectWallet = jest.fn(async () => undefined);
  const switchNetwork = jest.fn(async () => "switched" as const);
  let snapshot: SignedMessagesEnableSnapshot = {
    address: ADDRESS,
    canSignActiveWallet: true,
    isWalletConnectionPending: false,
    isConnectOpen: false,
    hasOtherLiveAccount: false,
    isRemoteWallet: false,
    requestGrant,
    connectWallet,
    networkName: "Ethereum",
    isNetworkSupported: () => true,
    switchNetwork,
    onEnabled,
    ...overrides,
  };
  const flow = new SignedMessagesEnableFlow({
    setStatus: (status) => statuses.push(status),
    setBusy: (value) => busy.push(value),
    report,
  });
  flow.update(snapshot);

  return {
    flow,
    report,
    requestGrant,
    grants,
    onEnabled,
    connectWallet,
    switchNetwork,
    status: () => statuses.at(-1) ?? null,
    isBusy: () => busy.at(-1) ?? false,
    set(next: Partial<SignedMessagesEnableSnapshot>) {
      snapshot = { ...snapshot, ...next };
      flow.update(snapshot);
    },
    /** The wallet is asked for the signature. */
    askWallet(index = grants.length - 1) {
      grants[index]?.options?.onSignatureRequested?.();
    },
    async answer(result: SignedMessagesGrantResult, index = grants.length - 1) {
      grants[index]?.result.resolve(result);
      await flush();
    },
  };
}

describe("turn on signed messages flow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("asks a connected wallet for the signature at once and confirms success", async () => {
    const harness = createHarness();

    harness.flow.enable("notice");
    await flush();

    expect(harness.requestGrant).toHaveBeenCalledWith(
      expect.objectContaining({ silent: true })
    );
    expect(harness.isBusy()).toBe(true);
    harness.askWallet();
    expect(harness.status()).toEqual({ kind: "waiting", remote: false });

    await harness.answer({ success: true });
    expect(harness.onEnabled).toHaveBeenCalledTimes(1);
    expect(harness.status()).toBeNull();
    expect(harness.isBusy()).toBe(false);
    expect(harness.report).toHaveBeenCalledWith("notice", "enabled");
  });

  it("hints after 8 seconds that a browser wallet may be locked", async () => {
    const harness = createHarness();
    harness.flow.enable("notice");
    await flush();
    harness.askWallet();

    jest.advanceTimersByTime(SLOW_WALLET_HINT_MS - 1);
    expect(harness.status()).toEqual({ kind: "waiting", remote: false });
    jest.advanceTimersByTime(1);
    expect(harness.status()).toEqual({ kind: "slow", remote: false });
    expect(harness.report).toHaveBeenCalledWith(
      "notice",
      "slow-wallet",
      "browser"
    );

    jest.advanceTimersByTime(REMOTE_WALLET_STALL_MS);
    expect(harness.status()).toEqual({ kind: "slow", remote: false });
  });

  it("opens the wallet connection without a live wallet and continues to the signature", async () => {
    const harness = createHarness({ canSignActiveWallet: false });

    harness.flow.enable("notice");
    await flush();
    expect(harness.connectWallet).toHaveBeenCalledTimes(1);
    expect(harness.status()).toEqual({ kind: "connecting" });
    expect(harness.isBusy()).toBe(true);
    expect(harness.requestGrant).not.toHaveBeenCalled();

    harness.set({ isConnectOpen: true });
    // The user unlocks and connects the wallet; no second click.
    harness.set({ isConnectOpen: false, canSignActiveWallet: true });
    await flush();

    expect(harness.requestGrant).toHaveBeenCalledTimes(1);
    expect(harness.report).toHaveBeenCalledWith("notice", "connect-open");
  });

  it("continues when the signer appears just after the modal closed", async () => {
    const harness = createHarness({ canSignActiveWallet: false });
    harness.flow.enable("notice");
    await flush();
    harness.set({ isConnectOpen: true });
    harness.set({ isConnectOpen: false });

    jest.advanceTimersByTime(500);
    harness.set({ canSignActiveWallet: true });
    await flush();

    expect(harness.requestGrant).toHaveBeenCalledTimes(1);
  });

  it("says the wallet did not connect when the modal closes without it", async () => {
    const harness = createHarness({ canSignActiveWallet: false });
    harness.flow.enable("devices");
    await flush();
    harness.set({ isConnectOpen: true });
    harness.set({ isConnectOpen: false });

    jest.advanceTimersByTime(1000);

    expect(harness.status()).toEqual({ kind: "not-connected" });
    expect(harness.isBusy()).toBe(false);
    expect(harness.report).toHaveBeenCalledWith("devices", "connect-cancelled");
    harness.set({ canSignActiveWallet: true });
    await flush();
    expect(harness.requestGrant).not.toHaveBeenCalled();
  });

  it("reports a connection surface that could not open", async () => {
    const harness = createHarness({
      canSignActiveWallet: false,
      connectWallet: jest.fn(async () => {
        throw new Error("AppKit failed");
      }),
    });
    harness.flow.enable("notice");
    await flush();

    expect(harness.status()).toEqual({
      kind: "error",
      reason: "connect-failed",
    });
    expect(harness.report).toHaveBeenCalledWith("notice", "connect-failed");
  });

  it("waits for a wallet that is still reconnecting after a reload", async () => {
    const harness = createHarness({
      canSignActiveWallet: false,
      isWalletConnectionPending: true,
    });
    harness.flow.enable("notice");
    expect(harness.status()).toEqual({ kind: "reconnecting" });
    expect(harness.connectWallet).not.toHaveBeenCalled();

    harness.set({
      isWalletConnectionPending: false,
      canSignActiveWallet: true,
    });
    await flush();
    expect(harness.requestGrant).toHaveBeenCalledTimes(1);
    expect(harness.connectWallet).not.toHaveBeenCalled();
  });

  it("opens the connection when reconnecting takes too long", async () => {
    const harness = createHarness({
      canSignActiveWallet: false,
      isWalletConnectionPending: true,
    });
    harness.flow.enable("notice");

    jest.advanceTimersByTime(RECONNECT_WAIT_MS);
    await flush();
    expect(harness.connectWallet).toHaveBeenCalledTimes(1);
  });

  it("names the account to switch to and continues once the wallet switches", async () => {
    const harness = createHarness({
      canSignActiveWallet: false,
      hasOtherLiveAccount: true,
    });
    harness.flow.enable("notice");

    expect(harness.status()).toEqual({
      kind: "wrong-account",
      address: ADDRESS,
    });
    expect(isReconnectStatus(harness.status())).toBe(true);
    expect(harness.isBusy()).toBe(false);
    expect(harness.connectWallet).not.toHaveBeenCalled();
    expect(harness.report).toHaveBeenCalledWith("notice", "wrong-account");

    harness.set({ hasOtherLiveAccount: false, canSignActiveWallet: true });
    await flush();
    expect(harness.requestGrant).toHaveBeenCalledTimes(1);
  });

  it("stops waiting for the account switch after a while", async () => {
    const harness = createHarness({
      canSignActiveWallet: false,
      hasOtherLiveAccount: true,
    });
    harness.flow.enable("notice");
    jest.advanceTimersByTime(WRONG_ACCOUNT_RESUME_MS + 1);

    harness.set({ hasOtherLiveAccount: false, canSignActiveWallet: true });
    await flush();
    expect(harness.requestGrant).not.toHaveBeenCalled();
    expect(harness.status()).toBeNull();
  });

  it("reconnects a wrong account through a fresh connection and then signs", async () => {
    const harness = createHarness({
      canSignActiveWallet: false,
      hasOtherLiveAccount: true,
    });
    harness.flow.enable("renew");
    harness.flow.reconnect();
    await flush();

    expect(harness.connectWallet).toHaveBeenCalledTimes(1);
    expect(harness.status()).toEqual({ kind: "connecting" });
    harness.set({ hasOtherLiveAccount: false, isConnectOpen: true });
    harness.set({ isConnectOpen: false, canSignActiveWallet: true });
    await flush();
    expect(harness.requestGrant).toHaveBeenCalledTimes(1);
  });

  it("drops a pending connection when the signed-in account changes", async () => {
    const harness = createHarness({ canSignActiveWallet: false });
    harness.flow.enable("notice");
    await flush();

    harness.set({
      address: "0x2222222222222222222222222222222222222222",
      canSignActiveWallet: true,
    });
    await flush();

    expect(harness.requestGrant).not.toHaveBeenCalled();
    expect(harness.status()).toBeNull();
    expect(harness.report).toHaveBeenCalledWith("notice", "account-changed");
  });

  it("switches an unsupported network before asking for the signature", async () => {
    let supported = false;
    const harness = createHarness({
      isNetworkSupported: () => supported,
      switchNetwork: jest.fn(async () => {
        supported = true;
        return "switched" as const;
      }),
    });
    harness.flow.enable("notice");
    expect(harness.status()).toEqual({
      kind: "switching-network",
      network: "Ethereum",
    });
    await flush();
    expect(harness.requestGrant).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["rejected", true, "network-switch-rejected"],
    ["failed", false, "wrong-network"],
  ] as const)(
    "explains a network switch that was %s",
    async (outcome, canceled, event) => {
      const harness = createHarness({
        isNetworkSupported: () => false,
        switchNetwork: jest.fn(async () => outcome),
      });
      harness.flow.enable("notice");
      await flush();

      expect(harness.requestGrant).not.toHaveBeenCalled();
      expect(harness.status()).toEqual({
        kind: "wrong-network",
        network: "Ethereum",
        canceled,
      });
      expect(harness.report).toHaveBeenCalledWith("notice", event);
    }
  );

  it("answers a declined signature calmly", async () => {
    const harness = createHarness();
    harness.flow.enable("notice");
    await flush();
    harness.askWallet();
    await harness.answer({ success: false, reason: "rejected" });

    expect(harness.status()).toEqual({ kind: "rejected" });
    expect(harness.isBusy()).toBe(false);
    expect(harness.report).toHaveBeenCalledWith(
      "notice",
      "rejected",
      "browser"
    );
  });

  it.each([
    "device-key",
    "challenge-failed",
    "challenge-mismatch",
    "signature-failed",
    "sign-in-failed",
    "context-changed",
  ] as const)("names a %s failure", async (reason) => {
    const harness = createHarness();
    harness.flow.enable("notice");
    await flush();
    await harness.answer({ success: false, reason });

    expect(harness.status()).toEqual({ kind: "error", reason });
    expect(harness.report).toHaveBeenCalledWith("notice", reason, "browser");
  });

  it("never offers phone pairing to a browser wallet", async () => {
    const harness = createHarness();
    harness.flow.enable("notice");
    await flush();
    harness.askWallet();
    await harness.answer({ success: false, reason: "walletconnect-session" });

    expect(harness.status()).toEqual({
      kind: "error",
      reason: "signature-failed",
    });
    expect(isReconnectStatus(harness.status())).toBe(false);
  });

  it("reports only reason codes, never the wallet address", async () => {
    const harness = createHarness({
      canSignActiveWallet: false,
      hasOtherLiveAccount: true,
    });
    harness.flow.enable("notice");
    harness.flow.reconnect();
    await flush();

    for (const call of harness.report.mock.calls) {
      expect(JSON.stringify(call)).not.toMatch(/0x/i);
    }
  });

  describe("WalletConnect (a wallet app on a phone)", () => {
    it("asks to approve on the phone, not to unlock", async () => {
      const harness = createHarness({ isRemoteWallet: true });
      harness.flow.enable("notice");
      await flush();
      harness.askWallet();

      expect(harness.status()).toEqual({ kind: "waiting", remote: true });
      jest.advanceTimersByTime(SLOW_WALLET_HINT_MS);
      expect(harness.status()).toEqual({ kind: "slow", remote: true });
      expect(isReconnectStatus(harness.status())).toBe(false);
    });

    it("offers to pair again after 20 seconds without an answer", async () => {
      const harness = createHarness({ isRemoteWallet: true });
      harness.flow.enable("notice");
      await flush();
      harness.askWallet();

      jest.advanceTimersByTime(REMOTE_WALLET_STALL_MS);
      expect(harness.status()).toEqual({ kind: "stalled" });
      expect(isReconnectStatus(harness.status())).toBe(true);
      expect(harness.report).toHaveBeenCalledWith(
        "notice",
        "walletconnect-no-answer",
        "remote"
      );
    });

    it("pairs again and requests the signature again by itself", async () => {
      const harness = createHarness({ isRemoteWallet: true });
      harness.flow.enable("notice");
      await flush();
      harness.askWallet(0);
      jest.advanceTimersByTime(REMOTE_WALLET_STALL_MS);

      harness.flow.reconnect();
      await flush();
      expect(harness.connectWallet).toHaveBeenCalledTimes(1);
      expect(harness.status()).toEqual({ kind: "connecting" });

      // Re-pairing drops the old session first.
      harness.set({ canSignActiveWallet: false, isConnectOpen: true });
      harness.set({ isConnectOpen: false, canSignActiveWallet: true });
      await flush();
      expect(harness.requestGrant).toHaveBeenCalledTimes(2);

      // The abandoned request fails late and is ignored.
      await harness.answer({ success: false, reason: "signature-failed" }, 0);
      expect(harness.status()).toBeNull();
      harness.askWallet(1);
      expect(harness.status()).toEqual({ kind: "waiting", remote: true });

      await harness.answer({ success: true }, 1);
      expect(harness.onEnabled).toHaveBeenCalledTimes(1);
      expect(harness.isBusy()).toBe(false);
    });

    it("offers to pair again after a WalletConnect session error", async () => {
      const harness = createHarness({ isRemoteWallet: true });
      harness.flow.enable("notice");
      await flush();
      harness.askWallet();
      await harness.answer({
        success: false,
        reason: "walletconnect-session",
      });

      expect(harness.status()).toEqual({
        kind: "error",
        reason: "walletconnect-session",
      });
      expect(isReconnectStatus(harness.status())).toBe(true);
      expect(harness.report).toHaveBeenCalledWith(
        "notice",
        "walletconnect-session",
        "remote"
      );

      harness.flow.reconnect();
      await flush();
      harness.set({ canSignActiveWallet: false, isConnectOpen: true });
      harness.set({ isConnectOpen: false, canSignActiveWallet: true });
      await flush();
      expect(harness.requestGrant).toHaveBeenCalledTimes(2);
    });

    it("treats a failed phone signature as a pairing problem, not a locked wallet", async () => {
      const harness = createHarness({ isRemoteWallet: true });
      harness.flow.enable("notice");
      await flush();
      harness.askWallet();
      await harness.answer({ success: false, reason: "signature-failed" });

      expect(harness.status()).toEqual({
        kind: "error",
        reason: "walletconnect-session",
      });
      expect(harness.report).toHaveBeenCalledWith(
        "notice",
        "signature-failed",
        "remote"
      );
    });
  });
});
