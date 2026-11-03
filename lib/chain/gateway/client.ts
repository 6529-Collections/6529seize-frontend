/**
 * The gateway client: GW1-GW7 of P41 §5.1 and the `track()` loop of §5.3.
 *
 * - GW4: identical bytes go to gateways of at least two operators, and are
 *   rebroadcast to them plus one more gateway after two silent polls
 *   (P41 §5.1: "the client resubmits after two silent blocks").
 * - GW5: every answer is a claim. Claims feed the status ladder with the
 *   number of distinct operators behind them; only a `ProofVerifier`
 *   (a light client in the target design) turns them into verified labels.
 * - GW7: the client is configured with gateways of at least two operators
 *   and refuses a list that cannot meet that.
 *
 * How the `decisions` data source (W6 unit C4, with W2's D7) will use it:
 * `decisions.vote()` builds a VOTE_SET body with `codec/ops.ts`, wraps it
 * in the envelope (`codec/envelope.ts`), has the Signer port sign the txId,
 * then calls `track(bytes, { awaitDecision: true })` and maps each
 * `ChainStatus` into the DataSource's provenance. The `Transport.submitTx`
 * port of PLAN-P2P §2 wraps `submit()`.
 */
import type { Hex } from "viem";

import { decodeSignedTx } from "../codec/envelope";
import {
  applyLadderEvent,
  deriveChainStatus,
  initialEvidence,
  isFinalOverlay,
  type ChainStatus,
  type GatewayRef,
  type LadderEvent,
  type LadderEvidence,
} from "../status-ladder";
import type {
  CheckTxAnswer,
  GatewayTransport,
  IncludedLocation,
  ProofVerifier,
  TxLocation,
} from "./transport";

/** One engine slot: P42 proposes 12 s slots. */
export const DEFAULT_POLL_INTERVAL_MS = 12_000;
export const DEFAULT_SILENT_POLLS = 2;
export const DEFAULT_MIN_OPERATORS = 2;

export class GatewayConfigError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "GatewayConfigError";
  }
}

export type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>;

export interface GatewayClientOptions {
  /** Ordered gateway list (GW7); the first gateway of each operator is primary. */
  readonly gateways: readonly GatewayTransport[];
  readonly minOperators?: number;
  readonly verifier?: ProofVerifier;
  readonly pollIntervalMs?: number;
  readonly silentPollsBeforeRebroadcast?: number;
  readonly sleep?: Sleep;
}

export interface TrackOptions {
  readonly signal?: AbortSignal;
  readonly onStatus?: (status: ChainStatus) => void;
  /** Votes: continue past Finalized until the decision record is verified. */
  readonly awaitDecision?: boolean;
  /** Safety bound on polls. */
  readonly maxPolls?: number;
}

export interface SubmitAnswer {
  readonly gateway: GatewayRef;
  /** null: the gateway did not answer. */
  readonly answer: CheckTxAnswer | null;
}

export interface SubmitResult {
  readonly txId: Hex;
  readonly answers: readonly SubmitAnswer[];
}

export interface GatewayClient {
  readonly primary: readonly GatewayRef[];
  submit(tx: Uint8Array, signal?: AbortSignal): Promise<SubmitResult>;
  track(tx: Uint8Array, options?: TrackOptions): Promise<ChainStatus>;
}

const DEFAULT_MAX_POLLS = 600;

/** setTimeout as a promise; its abort listener is removed when the timer fires. */
export const defaultSleep: Sleep = (ms, signal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(signal.reason as Error);
      return;
    }
    // Aborting `cleanup` removes the abort listener once the timer fires.
    const cleanup = new AbortController();
    const timer = setTimeout(() => {
      cleanup.abort();
      resolve();
    }, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason as Error);
      },
      { once: true, signal: cleanup.signal }
    );
  });

/** Splits the list into one gateway per operator (primary) and the rest. */
export function selectGateways(
  gateways: readonly GatewayTransport[],
  minOperators: number
): { readonly primary: GatewayTransport[]; readonly reserve: GatewayTransport[] } {
  const seen = new Set<string>();
  const primary: GatewayTransport[] = [];
  const reserve: GatewayTransport[] = [];
  for (const gateway of gateways) {
    if (seen.has(gateway.ref.operator)) {
      reserve.push(gateway);
    } else {
      seen.add(gateway.ref.operator);
      primary.push(gateway);
    }
  }
  if (seen.size < minOperators) {
    throw new GatewayConfigError(
      `GW7: gateways of at least ${minOperators} operators are required, got ${seen.size}`
    );
  }
  return { primary, reserve };
}

async function answerOf(
  gateway: GatewayTransport,
  tx: Uint8Array,
  signal: AbortSignal | undefined
): Promise<SubmitAnswer> {
  try {
    return { gateway: gateway.ref, answer: await gateway.submit(tx, signal) };
  } catch {
    return { gateway: gateway.ref, answer: null };
  }
}

async function locationOf(
  gateway: GatewayTransport,
  txId: Hex,
  signal: AbortSignal | undefined
): Promise<TxLocation | null> {
  try {
    return await gateway.locate(txId, signal);
  } catch {
    return null;
  }
}

async function headTimeOf(
  gateway: GatewayTransport,
  signal: AbortSignal | undefined
): Promise<bigint | null> {
  try {
    return (await gateway.head(signal)).timeMs;
  } catch {
    return null;
  }
}

async function safely(check: () => Promise<boolean>): Promise<boolean> {
  try {
    return await check();
  } catch {
    return false;
  }
}

function answerEvent(result: SubmitAnswer): LadderEvent {
  return result.answer === null
    ? { type: "submit-silent", gateway: result.gateway }
    : { type: "submit-answer", gateway: result.gateway, code: result.answer.code };
}

function locationEvent(gateway: GatewayRef, location: TxLocation | null): LadderEvent | null {
  if (location?.status === "included") {
    return {
      type: "inclusion-claim",
      gateway,
      height: location.height,
      index: location.index,
      code: location.code,
    };
  }
  if (location?.status === "dropped") {
    return { type: "drop-claim", gateway, reason: location.reason };
  }
  return null;
}

interface TrackContext {
  readonly tx: Uint8Array;
  readonly txId: Hex;
  readonly expiresAt: bigint;
  readonly options: TrackOptions;
}

class Tracking {
  private evidence: LadderEvidence;
  private readonly active: GatewayTransport[];
  private readonly reserve: GatewayTransport[];
  private silentPolls = 0;
  private readonly silence = new Map<string, number>();
  private lastStatus: ChainStatus | null = null;

  constructor(
    private readonly client: Required<Omit<GatewayClientOptions, "verifier" | "gateways">> & {
      readonly verifier: ProofVerifier | undefined;
    },
    private readonly ctx: TrackContext,
    split: { readonly primary: GatewayTransport[]; readonly reserve: GatewayTransport[] }
  ) {
    this.evidence = initialEvidence(ctx.txId);
    this.active = [...split.primary];
    this.reserve = [...split.reserve];
  }

  get status(): ChainStatus {
    return deriveChainStatus(this.evidence);
  }

  emit(): void {
    const status = this.status;
    const previous = this.lastStatus;
    if (previous === null || JSON.stringify(previous, bigintSafe) !== JSON.stringify(status, bigintSafe)) {
      this.lastStatus = status;
      this.ctx.options.onStatus?.(status);
    }
  }

  private apply(event: LadderEvent | null): void {
    if (event !== null) {
      this.evidence = applyLadderEvent(this.evidence, event);
    }
  }

  async broadcast(targets: readonly GatewayTransport[]): Promise<void> {
    const results = await Promise.all(
      targets.map((gateway) => answerOf(gateway, this.ctx.tx, this.ctx.options.signal))
    );
    results.forEach((result) => this.apply(answerEvent(result)));
    this.emit();
  }

  isDone(): boolean {
    const status = this.status;
    if (status.label === "in-decision") {
      return true;
    }
    if (status.label === "finalized") {
      return this.ctx.options.awaitDecision !== true || this.client.verifier === undefined;
    }
    if (isFinalOverlay(status.overlay)) {
      if (status.overlay === "rejected" || status.verified) {
        return true;
      }
      // A reported failure can still be verified (or refuted) by the verifier.
      if (status.overlay === "failed" && this.client.verifier !== undefined) {
        return false;
      }
      return this.agreed(status);
    }
    return (
      this.client.verifier === undefined &&
      status.label === "committed" &&
      !status.conflict &&
      this.agreed(status)
    );
  }

  private agreed(status: ChainStatus): boolean {
    return status.reportedBy >= this.client.minOperators;
  }

  async poll(): Promise<void> {
    const signal = this.ctx.options.signal;
    const results = await Promise.all(
      this.active.map(async (gateway) => ({
        gateway,
        location: await locationOf(gateway, this.ctx.txId, signal),
      }))
    );
    results.forEach(({ gateway, location }) => this.apply(locationEvent(gateway.ref, location)));
    const included = results
      .map(({ location }) => location)
      .filter((location): location is IncludedLocation => location?.status === "included");
    await this.replaceSilent(results);
    if (included.length === 0) {
      await this.checkExpiry();
      await this.maybeRebroadcast(results.map(({ location }) => location));
    } else {
      this.silentPolls = 0;
      await this.verify(included);
    }
    this.emit();
  }

  /** GW4: a gateway silent for N polls is swapped for a reserve, which gets the bytes. */
  private async replaceSilent(
    results: readonly { readonly gateway: GatewayTransport; readonly location: TxLocation | null }[]
  ): Promise<void> {
    const newcomers: GatewayTransport[] = [];
    for (const { gateway, location } of results) {
      const count = location === null ? (this.silence.get(gateway.ref.id) ?? 0) + 1 : 0;
      this.silence.set(gateway.ref.id, count);
      const replacement =
        count >= this.client.silentPollsBeforeRebroadcast ? this.reserve.shift() : undefined;
      if (replacement !== undefined) {
        this.active.splice(this.active.indexOf(gateway), 1, replacement);
        newcomers.push(replacement);
      }
    }
    if (newcomers.length > 0) {
      await this.broadcast(newcomers);
    }
  }

  private async checkExpiry(): Promise<void> {
    const signal = this.ctx.options.signal;
    const times = await Promise.all(this.active.map((gateway) => headTimeOf(gateway, signal)));
    times.forEach((timeMs, index) => {
      const gateway = this.active[index];
      if (gateway !== undefined && timeMs !== null && timeMs >= this.ctx.expiresAt) {
        this.apply({ type: "drop-claim", gateway: gateway.ref, reason: "expired" });
      }
    });
  }

  /** P41 §5.3: pending and absent from every gateway: rebroadcast to G and one more. */
  private async maybeRebroadcast(locations: readonly (TxLocation | null)[]): Promise<void> {
    const anyPending = locations.some((location) => location?.status === "pending");
    if (anyPending) {
      this.silentPolls = 0;
      return;
    }
    this.silentPolls += 1;
    if (this.silentPolls < this.client.silentPollsBeforeRebroadcast) {
      return;
    }
    this.silentPolls = 0;
    const extra = this.reserve.shift();
    if (extra !== undefined) {
      this.active.push(extra);
    }
    await this.broadcast(this.active);
  }

  /**
   * Verifies claimed locations one after another, by design: each step
   * reads the evidence the previous one recorded, so a verified inclusion
   * is not checked twice.
   */
  private async verify(locations: readonly IncludedLocation[], index = 0): Promise<void> {
    const verifier = this.client.verifier;
    const location = locations[index];
    if (verifier === undefined || location === undefined) {
      return;
    }
    await this.verifyOne(verifier, location);
    await this.verify(locations, index + 1);
  }

  private async verifyOne(verifier: ProofVerifier, location: IncludedLocation): Promise<void> {
    const signal = this.ctx.options.signal;
    const txId = this.ctx.txId;
    if (
      this.evidence.verifiedInclusion === null &&
      (await safely(() => verifier.verifyInclusion(txId, location, signal)))
    ) {
      this.apply({ type: "inclusion-verified", height: location.height, index: location.index });
    }
    const verified = this.evidence.verifiedInclusion;
    if (
      verified?.height === location.height &&
      verified.index === location.index &&
      this.evidence.verifiedResult === null &&
      (await safely(() => verifier.verifyResult(txId, location, signal)))
    ) {
      this.apply({
        type: "result-verified",
        height: location.height,
        index: location.index,
        code: location.code,
      });
    }
    await this.verifyDecision(verifier, location);
  }

  private async verifyDecision(verifier: ProofVerifier, location: IncludedLocation): Promise<void> {
    const claim = location.decision;
    if (
      this.ctx.options.awaitDecision !== true ||
      claim === null ||
      this.evidence.verifiedResult?.code !== 0 ||
      this.evidence.verifiedDecision !== null
    ) {
      return;
    }
    if (await safely(() => verifier.verifyDecision(this.ctx.txId, claim, this.ctx.options.signal))) {
      this.apply({
        type: "decision-verified",
        decision: { decisionId: claim.decisionId, decisionTimeMs: claim.decisionTimeMs },
      });
    }
  }
}

/** Polls are sequential by design: one per slot, each reading the last one's evidence. */
async function pollUntilDone(
  tracking: Tracking,
  settings: { readonly sleep: Sleep; readonly pollIntervalMs: number },
  options: TrackOptions,
  remaining: number
): Promise<void> {
  if (remaining <= 0 || tracking.isDone()) {
    return;
  }
  await settings.sleep(settings.pollIntervalMs, options.signal);
  await tracking.poll();
  await pollUntilDone(tracking, settings, options, remaining - 1);
}

function bigintSafe(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

export function createGatewayClient(options: GatewayClientOptions): GatewayClient {
  const minOperators = options.minOperators ?? DEFAULT_MIN_OPERATORS;
  const split = selectGateways(options.gateways, minOperators);
  const settings = {
    minOperators,
    verifier: options.verifier,
    pollIntervalMs: options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
    silentPollsBeforeRebroadcast: options.silentPollsBeforeRebroadcast ?? DEFAULT_SILENT_POLLS,
    sleep: options.sleep ?? defaultSleep,
  };

  return {
    primary: split.primary.map((gateway) => gateway.ref),

    async submit(tx: Uint8Array, signal?: AbortSignal): Promise<SubmitResult> {
      const { txId } = decodeSignedTx(tx);
      const answers = await Promise.all(split.primary.map((g) => answerOf(g, tx, signal)));
      return { txId, answers };
    },

    async track(tx: Uint8Array, trackOptions: TrackOptions = {}): Promise<ChainStatus> {
      const decoded = decodeSignedTx(tx);
      const tracking = new Tracking(
        settings,
        { tx, txId: decoded.txId, expiresAt: decoded.tx.header.expiresAt, options: trackOptions },
        split
      );
      tracking.emit();
      await tracking.broadcast(split.primary);
      await pollUntilDone(tracking, settings, trackOptions, trackOptions.maxPolls ?? DEFAULT_MAX_POLLS);
      return tracking.status;
    },
  };
}
