import type {
  RequestSignedMessagesGrant,
  SignedMessagesGrantFailure,
  SignedMessagesGrantResult,
} from "@/components/auth/authSignedMessagesGrant";
import { CONNECTED_ACTION_CLOSE_GRACE_MS } from "@/components/auth/useConnectedAction";
import type { NetworkSwitchOutcome } from "@/hooks/device-signing/useSignedMessagesWallet";
import type {
  SignedMessagesEnableEvent,
  SignedMessagesEnableSource,
  SignedMessagesEnableWallet,
} from "@/utils/monitoring/signedMessagesEnableMonitoring";

/** After this long without an answer, the wallet is probably locked or hidden. */
export const SLOW_WALLET_HINT_MS = 8_000;
/**
 * After this long a WalletConnect request has probably not reached the phone
 * (expired relay session or lost pairing), so pairing again is offered.
 */
export const REMOTE_WALLET_STALL_MS = 20_000;
/** How long to wait for a wallet that is still reconnecting after a reload. */
export const RECONNECT_WAIT_MS = 8_000;
/** How long switching to the right account still continues by itself. */
export const WRONG_ACCOUNT_RESUME_MS = 120_000;

const WRONG_ACCOUNT = "wrong-account";
const WRONG_NETWORK = "wrong-network";
const WALLET_CONNECT_SESSION = "walletconnect-session";

export type SignedMessagesEnableError =
  | "connect-failed"
  | "unexpected"
  | Exclude<
      SignedMessagesGrantFailure,
      "rejected" | "wallet-disconnected" | typeof WRONG_NETWORK
    >;

export type SignedMessagesEnableStatus =
  | {
      readonly kind:
        | "reconnecting"
        | "connecting"
        | "rejected"
        | "not-connected"
        /** A WalletConnect request with no answer: pairing again is offered. */
        | "stalled";
    }
  /** `remote`: the wallet is an app on a phone, reached via WalletConnect. */
  | { readonly kind: "waiting" | "slow"; readonly remote: boolean }
  | { readonly kind: "switching-network"; readonly network: string }
  | {
      readonly kind: typeof WRONG_NETWORK;
      readonly network: string;
      readonly canceled: boolean;
    }
  | { readonly kind: typeof WRONG_ACCOUNT; readonly address: string }
  | { readonly kind: "error"; readonly reason: SignedMessagesEnableError };

/** Statuses whose fix is a fresh wallet connection ("Reconnect wallet"). */
export const isReconnectStatus = (
  status: SignedMessagesEnableStatus | null
): boolean =>
  status?.kind === WRONG_ACCOUNT ||
  status?.kind === "stalled" ||
  (status?.kind === "error" && status.reason === WALLET_CONNECT_SESSION);

/** The latest wallet and auth state the flow acts on. */
export interface SignedMessagesEnableSnapshot {
  /** The active (signed-in) wallet, whether or not it is live. */
  readonly address: string | undefined;
  /** A live connection to the active wallet. */
  readonly canSignActiveWallet: boolean;
  /** The wallet is still reconnecting after a page load. */
  readonly isWalletConnectionPending: boolean;
  readonly isConnectOpen: boolean;
  /** The live wallet is another signed-in account. */
  readonly hasOtherLiveAccount: boolean;
  /** The live wallet answers through WalletConnect (usually a phone app). */
  readonly isRemoteWallet: boolean;
  readonly requestGrant: RequestSignedMessagesGrant | undefined;
  /** Disconnects any live wallet and opens the connection surface. */
  readonly connectWallet: () => Promise<void>;
  readonly networkName: string;
  readonly isNetworkSupported: () => boolean;
  readonly switchNetwork: () => Promise<NetworkSwitchOutcome>;
  readonly onEnabled: () => void;
}

interface SignedMessagesEnableFlowDeps {
  readonly setStatus: (status: SignedMessagesEnableStatus | null) => void;
  readonly setBusy: (busy: boolean) => void;
  readonly report: (
    source: SignedMessagesEnableSource,
    event: SignedMessagesEnableEvent,
    wallet?: SignedMessagesEnableWallet
  ) => void;
}

interface PendingStep {
  readonly stage: "reconnecting" | "connecting" | typeof WRONG_ACCOUNT;
  /** Lowercase active wallet when the step started. */
  readonly address: string;
  readonly source: SignedMessagesEnableSource;
  readonly resumeUntil: number;
  modalOpened: boolean;
}

interface SignatureAttempt {
  readonly source: SignedMessagesEnableSource;
  readonly snapshot: SignedMessagesEnableSnapshot;
  readonly isCurrent: () => boolean;
  remote: boolean;
}

type Timer = ReturnType<typeof setTimeout> | null;

const clearTimer = (timer: Timer): null => {
  if (timer) {
    clearTimeout(timer);
  }
  return null;
};

const walletKind = (remote: boolean): SignedMessagesEnableWallet =>
  remote ? "remote" : "browser";

const toFailureStatus = (
  reason: SignedMessagesGrantFailure,
  network: string,
  isRemoteWallet: boolean
): SignedMessagesEnableStatus => {
  if (reason === "rejected") {
    return { kind: "rejected" };
  }
  if (reason === "wallet-disconnected") {
    return { kind: "not-connected" };
  }
  if (reason === WRONG_NETWORK) {
    return { kind: WRONG_NETWORK, network, canceled: false };
  }
  const isPairingProblem =
    reason === WALLET_CONNECT_SESSION || reason === "signature-failed";
  if (isPairingProblem) {
    // A phone wallet has nothing to unlock here; pairing again is the fix. A
    // browser wallet has no WalletConnect pairing to renew.
    return {
      kind: "error",
      reason: isRemoteWallet ? WALLET_CONNECT_SESSION : "signature-failed",
    };
  }
  return { kind: "error", reason };
};

/**
 * "Turn on signed messages" from one click: wait for a reconnecting wallet,
 * open the wallet connection when there is no live signer (a locked wallet
 * asks to unlock there), switch to a supported network, then request the one
 * signature. Every step shows a status and every early end is reported. A
 * WalletConnect wallet that does not answer can be paired again, and the
 * signature is then requested again by itself.
 */
export class SignedMessagesEnableFlow {
  private snapshot: SignedMessagesEnableSnapshot | null = null;
  private pending: PendingStep | null = null;
  /** Increments per signature attempt; an abandoned attempt is ignored. */
  private attempt = 0;
  private signing = false;
  private lastSource: SignedMessagesEnableSource = "notice";
  private slowTimer: Timer = null;
  private stallTimer: Timer = null;
  private closeTimer: Timer = null;
  private reconnectTimer: Timer = null;
  private readonly deps: SignedMessagesEnableFlowDeps;

  constructor(deps: SignedMessagesEnableFlowDeps) {
    this.deps = deps;
  }

  /** Takes the latest wallet and auth state and resumes a pending step. */
  readonly update = (next: SignedMessagesEnableSnapshot): void => {
    this.snapshot = next;
    this.sync();
  };

  readonly enable = (source: SignedMessagesEnableSource): void => {
    if (
      this.signing ||
      (this.pending && this.pending.stage !== WRONG_ACCOUNT)
    ) {
      return;
    }
    this.lastSource = source;
    this.pending = null;
    this.clearTimers();
    this.deps.report(source, "start");
    this.deps.setStatus(null);
    this.proceed(source, false);
  };

  /**
   * "Reconnect wallet": a fresh connection (a new pairing for WalletConnect),
   * then the signature again. A signature still waiting is abandoned.
   */
  readonly reconnect = (): void => {
    const source = this.pending?.source ?? this.lastSource;
    if (this.signing) {
      this.attempt += 1;
      this.signing = false;
      this.clearSignatureTimers();
    }
    this.deps.report(
      source,
      "reconnect",
      walletKind(this.snapshot?.isRemoteWallet === true)
    );
    this.connect(source);
  };

  /** Drops pending steps; a signature already requested still finishes. */
  readonly dispose = (): void => {
    this.pending = null;
    this.clearTimers();
  };

  private clearSignatureTimers() {
    this.slowTimer = clearTimer(this.slowTimer);
    this.stallTimer = clearTimer(this.stallTimer);
  }

  private clearTimers() {
    this.clearSignatureTimers();
    this.closeTimer = clearTimer(this.closeTimer);
    this.reconnectTimer = clearTimer(this.reconnectTimer);
  }

  private settle(status: SignedMessagesEnableStatus | null) {
    this.pending = null;
    this.clearTimers();
    this.deps.setStatus(status);
    this.deps.setBusy(false);
  }

  private arm(
    stage: PendingStep["stage"],
    address: string,
    source: SignedMessagesEnableSource,
    resumeUntil = 0
  ): PendingStep {
    const step: PendingStep = {
      stage,
      address: address.toLowerCase(),
      source,
      resumeUntil,
      modalOpened: false,
    };
    this.pending = step;
    this.closeTimer = clearTimer(this.closeTimer);
    this.reconnectTimer = clearTimer(this.reconnectTimer);
    return step;
  }

  /** Re-evaluates a pending step after the wallet or auth state changed. */
  private sync() {
    const step = this.pending;
    const current = this.snapshot;
    if (!step || !current) {
      return;
    }
    if ((current.address?.toLowerCase() ?? "") !== step.address) {
      this.deps.report(step.source, "account-changed");
      this.settle(null);
      return;
    }
    if (step.stage === "reconnecting") {
      if (!current.isWalletConnectionPending) {
        this.proceed(step.source, true);
      }
      return;
    }
    if (current.canSignActiveWallet) {
      if (step.stage === WRONG_ACCOUNT && Date.now() > step.resumeUntil) {
        this.settle(null);
        return;
      }
      void this.sign(step.source);
      return;
    }
    if (step.stage !== "connecting") {
      return;
    }
    if (current.isConnectOpen) {
      this.markConnectionOpen(step);
    } else if (step.modalOpened) {
      this.scheduleCloseCheck(step);
    }
  }

  /** The connection surface is showing: it has not been closed yet. */
  private markConnectionOpen(step: PendingStep) {
    step.modalOpened = true;
    this.closeTimer = clearTimer(this.closeTimer);
  }

  private proceed(
    source: SignedMessagesEnableSource,
    reconnectWaitOver: boolean
  ) {
    const current = this.snapshot;
    if (!current?.address) {
      this.settle(null);
      return;
    }
    if (current.canSignActiveWallet) {
      void this.sign(source);
      return;
    }
    if (current.isWalletConnectionPending && !reconnectWaitOver) {
      this.waitForReconnect(source, current.address);
      return;
    }
    if (current.hasOtherLiveAccount) {
      this.showWrongAccount(source, current.address);
      return;
    }
    this.connect(source);
  }

  private waitForReconnect(
    source: SignedMessagesEnableSource,
    address: string
  ) {
    const step = this.arm("reconnecting", address, source);
    this.deps.report(source, "reconnect-wait");
    this.deps.setStatus({ kind: "reconnecting" });
    this.deps.setBusy(true);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.pending === step) {
        this.proceed(source, true);
      }
    }, RECONNECT_WAIT_MS);
  }

  private showWrongAccount(
    source: SignedMessagesEnableSource,
    address: string
  ) {
    this.arm(
      WRONG_ACCOUNT,
      address,
      source,
      Date.now() + WRONG_ACCOUNT_RESUME_MS
    );
    this.deps.report(source, WRONG_ACCOUNT);
    this.deps.setStatus({ kind: WRONG_ACCOUNT, address });
    this.deps.setBusy(false);
  }

  private connect(source: SignedMessagesEnableSource) {
    const current = this.snapshot;
    if (!current?.address) {
      this.settle(null);
      return;
    }
    const step = this.arm("connecting", current.address, source);
    this.deps.report(source, "connect-open");
    this.deps.setStatus({ kind: "connecting" });
    this.deps.setBusy(true);
    void this.openConnection(step, current.connectWallet);
  }

  private async openConnection(
    step: PendingStep,
    connectWallet: () => Promise<void>
  ) {
    try {
      await connectWallet();
    } catch {
      if (this.pending === step) {
        this.deps.report(step.source, "connect-failed");
        this.settle({ kind: "error", reason: "connect-failed" });
      }
      return;
    }
    if (this.pending === step) {
      step.modalOpened = true;
      if (!this.snapshot?.isConnectOpen) {
        this.scheduleCloseCheck(step);
      }
    }
  }

  private scheduleCloseCheck(step: PendingStep) {
    if (this.closeTimer) {
      return;
    }
    // AppKit can report the modal closed just before the signer appears.
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      const current = this.snapshot;
      if (this.pending !== step || !current || current.isConnectOpen) {
        return;
      }
      if (current.canSignActiveWallet) {
        void this.sign(step.source);
      } else if (current.hasOtherLiveAccount && current.address) {
        this.showWrongAccount(step.source, current.address);
      } else {
        this.deps.report(step.source, "connect-cancelled");
        this.settle({ kind: "not-connected" });
      }
    }, CONNECTED_ACTION_CLOSE_GRACE_MS);
  }

  private async sign(source: SignedMessagesEnableSource) {
    const current = this.snapshot;
    if (this.signing || !current) {
      return;
    }
    this.pending = null;
    this.clearTimers();
    const { requestGrant } = current;
    if (!requestGrant) {
      this.deps.report(source, "unavailable");
      this.settle({ kind: "error", reason: "unavailable" });
      return;
    }
    this.attempt += 1;
    const thisAttempt = this.attempt;
    const run: SignatureAttempt = {
      source,
      snapshot: current,
      isCurrent: () => thisAttempt === this.attempt,
      remote: current.isRemoteWallet,
    };
    this.signing = true;
    this.deps.setBusy(true);
    try {
      if (
        !current.isNetworkSupported() &&
        !(await this.switchToSupportedNetwork(run))
      ) {
        return;
      }
      this.deps.setStatus(null);
      const result = await requestGrant({
        silent: true,
        onSignatureRequested: () => this.onSignatureRequested(run),
      });
      this.finishSignature(run, result);
    } catch {
      if (run.isCurrent()) {
        this.deps.report(source, "unexpected");
        this.settle({ kind: "error", reason: "unexpected" });
      }
    } finally {
      if (run.isCurrent()) {
        this.signing = false;
        this.clearSignatureTimers();
      }
    }
  }

  /** Switches an unsupported network first; false when that did not work. */
  private async switchToSupportedNetwork(
    run: SignatureAttempt
  ): Promise<boolean> {
    const { snapshot, source } = run;
    const network = snapshot.networkName;
    this.deps.report(source, "network-switch");
    this.deps.setStatus({ kind: "switching-network", network });
    const outcome = await snapshot.switchNetwork();
    if (!run.isCurrent()) {
      return false;
    }
    if (outcome === "switched") {
      return true;
    }
    const canceled = outcome === "rejected";
    this.deps.report(
      source,
      canceled ? "network-switch-rejected" : WRONG_NETWORK
    );
    this.settle({ kind: WRONG_NETWORK, network, canceled });
    return false;
  }

  private onSignatureRequested(run: SignatureAttempt) {
    if (!run.isCurrent()) {
      return;
    }
    run.remote = this.snapshot?.isRemoteWallet ?? run.remote;
    const { remote, source } = run;
    const wallet = walletKind(remote);
    this.deps.report(source, "signature-requested", wallet);
    this.deps.setStatus({ kind: "waiting", remote });
    this.clearSignatureTimers();
    this.slowTimer = setTimeout(() => {
      this.slowTimer = null;
      if (run.isCurrent()) {
        this.deps.report(source, "slow-wallet", wallet);
        this.deps.setStatus({ kind: "slow", remote });
      }
    }, SLOW_WALLET_HINT_MS);
    if (!remote) {
      return;
    }
    this.stallTimer = setTimeout(() => {
      this.stallTimer = null;
      if (run.isCurrent()) {
        this.deps.report(source, "walletconnect-no-answer", wallet);
        this.deps.setStatus({ kind: "stalled" });
      }
    }, REMOTE_WALLET_STALL_MS);
  }

  private finishSignature(
    run: SignatureAttempt,
    result: SignedMessagesGrantResult
  ) {
    const { snapshot, source, remote } = run;
    if (!run.isCurrent()) {
      // An abandoned attempt only matters if the wallet still approved it.
      if (result.success) {
        this.deps.report(source, "enabled");
        if (!this.signing) {
          this.settle(null);
        }
        snapshot.onEnabled();
      }
      return;
    }
    if (result.success) {
      this.deps.report(source, "enabled");
      this.settle(null);
      snapshot.onEnabled();
      return;
    }
    this.deps.report(source, result.reason, walletKind(remote));
    this.settle(toFailureStatus(result.reason, snapshot.networkName, remote));
  }
}
