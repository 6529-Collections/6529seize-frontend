/**
 * A deterministic in-memory chain with gateways in front of it, for tests
 * and CI. It is not a node: it orders transactions, keeps nonces and
 * validity windows, and settles decisions on request, so the gateway
 * client and status ladder can be exercised end to end.
 *
 * What it checks, in P40 §2.3 order: decoding, size, network, schema and
 * operation (steps 1-4), header and signature-list rules (6), body schema
 * rules (7), the validity window (8), keyType-1 signatures by ecrecover (9)
 * and the nonce (11). It does not resolve signers or grants, verify
 * Ed25519 or contract-wallet signatures (their keys live in grant state it
 * does not keep), charge fees, or run handlers: every included transaction
 * succeeds unless a failure is injected.
 *
 * Time is protocol time in ms (P28 §2.3) and only moves when a block is
 * produced. Nothing here reads a clock or a random source.
 */
import { recoverAddress, type Hex } from "viem";

import {
  checkHeaderRules,
  checkSignatureList,
  decodeSignedTx,
  KeyType,
  type ChainNetwork,
  type DecodedSignedTx,
} from "../codec/envelope";
import { ChainCodecError, ChainResultCode } from "../codec/errors";
import { decisionId as deriveDecisionId } from "../codec/ids";
import { EXAMPLE_DEVNET } from "../codec/network";
import { OpType } from "../codec/ops";
import { checkBodyRules } from "../codec/rules";
import type {
  ChainEvidence,
  CheckTxAnswer,
  DecisionClaim,
  GatewayHead,
  GatewayTransport,
  TxLocation,
} from "../gateway/transport";
import type { GatewayRef } from "../status-ladder";

export const MOCK_EVIDENCE_KIND = "mock-chain/v0";
/** P40 §13's notBefore, so the design's vectors are valid at genesis. */
export const MOCK_GENESIS_TIME_MS = 1_800_000_000_000n;
export const MOCK_BLOCK_TIME_MS = 12_000n;

export interface MockChainOptions {
  readonly network?: ChainNetwork;
  readonly genesisTimeMs?: bigint;
  readonly blockTimeMs?: bigint;
}

export interface MockBlock {
  readonly height: bigint;
  readonly timeMs: bigint;
  readonly txIds: readonly Hex[];
}

/**
 * honest: relays and answers truthfully. silent: never answers.
 * censor: says code 0 but never relays. liar: claims every transaction is
 * included, without evidence (P41 §5.1's malicious-gateway table).
 */
export type MockGatewayBehavior = "honest" | "silent" | "censor" | "liar";

export interface MockGateway extends GatewayTransport {
  setBehavior(behavior: MockGatewayBehavior): void;
}

export interface MockChain {
  readonly network: ChainNetwork;
  /** Distinguishes evidence of one mock chain from another's. */
  readonly instance: string;
  head(): GatewayHead;
  submit(tx: Uint8Array): Promise<CheckTxAnswer>;
  produceBlock(): MockBlock;
  locate(txId: Hex): TxLocation;
  /** Settles decision D of a competition over the votes included before D. */
  settleDecision(competitionId: Hex, decisionTimeMs: bigint): Hex;
  /** The next inclusion of `txId` fails with handler code `code` (>= 0x1000). */
  injectFailure(txId: Hex, code: number): void;
  gateway(ref: GatewayRef, behavior?: MockGatewayBehavior): MockGateway;
}

interface Pending {
  readonly decoded: DecodedSignedTx;
}

interface Included {
  readonly decoded: DecodedSignedTx;
  readonly height: bigint;
  readonly index: number;
  readonly timeMs: bigint;
  readonly code: number;
}

let instances = 0;

function answer(error: ChainCodecError | null): CheckTxAnswer {
  return error === null ? { code: 0, detail: 0 } : { code: error.code, detail: error.detail };
}

function namespaceKey(decoded: DecodedSignedTx): string {
  const h = decoded.tx.header;
  return `${h.principal}:${h.keyId}:${h.nonceLane}`;
}

function statelessCheck(decoded: DecodedSignedTx): ChainCodecError | null {
  const { header, op, body, signatures } = decoded.tx;
  return (
    checkHeaderRules(header, op.opType) ??
    checkSignatureList(header, signatures) ??
    checkBodyRules(op, body, { principal: header.principal, headerNotBefore: header.notBefore })
  );
}

async function signatureCheck(decoded: DecodedSignedTx): Promise<ChainCodecError | null> {
  const [first] = decoded.tx.signatures;
  if (first?.keyType !== KeyType.SECP256K1) {
    return null;
  }
  const expected = `0x${decoded.tx.header.keyId.slice(26)}`.toLowerCase();
  try {
    const recovered = await recoverAddress({ hash: decoded.txId, signature: first.sig });
    return recovered.toLowerCase() === expected
      ? null
      : new ChainCodecError(ChainResultCode.BAD_SIGNATURE, "signature does not match keyId");
  } catch {
    return new ChainCodecError(ChainResultCode.BAD_SIGNATURE, "signature does not recover");
  }
}

function decodeOrError(
  tx: Uint8Array,
  network: ChainNetwork
): DecodedSignedTx | ChainCodecError {
  try {
    return decodeSignedTx(tx, { expectedNetworkId: network.networkId });
  } catch (error) {
    if (error instanceof ChainCodecError) {
      return error;
    }
    return new ChainCodecError(ChainResultCode.MALFORMED, "undecodable");
  }
}

class MockChainState implements MockChain {
  readonly network: ChainNetwork;
  readonly instance: string;
  private height = 0n;
  private timeMs: bigint;
  private readonly blockTimeMs: bigint;
  private readonly mempool = new Map<Hex, Pending>();
  private readonly included = new Map<Hex, Included>();
  private readonly dropped = new Map<Hex, "expired" | "replaced">();
  private readonly nextNonce = new Map<string, bigint>();
  private readonly failures = new Map<Hex, number>();
  private readonly decisions = new Map<Hex, DecisionClaim>();

  constructor(options: MockChainOptions) {
    instances += 1;
    this.instance = `mock-${instances}`;
    this.network = options.network ?? EXAMPLE_DEVNET;
    this.timeMs = options.genesisTimeMs ?? MOCK_GENESIS_TIME_MS;
    this.blockTimeMs = options.blockTimeMs ?? MOCK_BLOCK_TIME_MS;
  }

  head(): GatewayHead {
    return { height: this.height, timeMs: this.timeMs };
  }

  private nonceOf(decoded: DecodedSignedTx): bigint {
    return this.nextNonce.get(namespaceKey(decoded)) ?? 0n;
  }

  private windowCheck(decoded: DecodedSignedTx): ChainCodecError | null {
    const { notBefore, expiresAt } = decoded.tx.header;
    const nextTime = this.timeMs + this.blockTimeMs;
    if (notBefore > nextTime) {
      return new ChainCodecError(ChainResultCode.NOT_YET_VALID, "not yet valid");
    }
    return expiresAt <= this.timeMs
      ? new ChainCodecError(ChainResultCode.EXPIRED, "expired")
      : null;
  }

  async submit(tx: Uint8Array): Promise<CheckTxAnswer> {
    const decoded = decodeOrError(tx, this.network);
    if (decoded instanceof ChainCodecError) {
      return answer(decoded);
    }
    if (this.mempool.has(decoded.txId)) {
      return answer(null); // GW4: a duplicate is harmless
    }
    const failure =
      statelessCheck(decoded) ?? this.windowCheck(decoded) ?? (await signatureCheck(decoded));
    if (failure !== null) {
      return answer(failure);
    }
    if (this.included.has(decoded.txId) || decoded.tx.header.nonce < this.nonceOf(decoded)) {
      return answer(new ChainCodecError(ChainResultCode.NONCE, "nonce already used"));
    }
    this.mempool.set(decoded.txId, { decoded });
    return answer(null);
  }

  private settlePending(txId: Hex, pending: Pending, txIds: Hex[]): boolean {
    const header = pending.decoded.tx.header;
    const next = this.nonceOf(pending.decoded);
    if (header.expiresAt <= this.timeMs || header.nonce < next) {
      this.dropped.set(txId, header.nonce < next ? "replaced" : "expired");
      this.mempool.delete(txId);
      return true;
    }
    if (header.nonce !== next || header.notBefore > this.timeMs) {
      return false;
    }
    const code = this.failures.get(txId) ?? 0;
    this.included.set(txId, {
      decoded: pending.decoded,
      height: this.height,
      index: txIds.length,
      timeMs: this.timeMs,
      code,
    });
    this.nextNonce.set(namespaceKey(pending.decoded), next + 1n);
    this.mempool.delete(txId);
    txIds.push(txId);
    return true;
  }

  produceBlock(): MockBlock {
    this.height += 1n;
    this.timeMs += this.blockTimeMs;
    const txIds: Hex[] = [];
    // Repeat so a key's consecutive nonces can land in one block.
    for (let changed = true; changed; ) {
      changed = false;
      for (const [txId, pending] of [...this.mempool.entries()]) {
        changed = this.settlePending(txId, pending, txIds) || changed;
      }
    }
    return { height: this.height, timeMs: this.timeMs, txIds };
  }

  private evidence(payload: Readonly<Record<string, string | number>>): ChainEvidence {
    return { kind: MOCK_EVIDENCE_KIND, payload: { instance: this.instance, ...payload } };
  }

  locate(txId: Hex): TxLocation {
    const id = txId.toLowerCase() as Hex;
    const found = this.included.get(id);
    if (found !== undefined) {
      return {
        status: "included",
        height: found.height,
        index: found.index,
        code: found.code,
        detail: 0,
        evidence: this.evidence({ txId: id, height: found.height.toString(), index: found.index }),
        decision: this.decisions.get(id) ?? null,
      };
    }
    if (this.mempool.has(id)) {
      return { status: "pending" };
    }
    const dropped = this.dropped.get(id);
    return dropped === undefined ? { status: "absent" } : { status: "dropped", reason: dropped };
  }

  settleDecision(competitionId: Hex, decisionTimeMs: bigint): Hex {
    if (this.timeMs < decisionTimeMs) {
      throw new Error("the decision time has not passed on this chain");
    }
    const id = deriveDecisionId(competitionId, decisionTimeMs);
    for (const [txId, entry] of this.included) {
      const { op, body } = entry.decoded.tx;
      const votedCompetition = (body as { readonly competitionId?: unknown }).competitionId;
      // P31 §6.2: a vote at tau = D counts nothing for D.
      if (
        op.opType === OpType.VOTE_SET &&
        votedCompetition === competitionId.toLowerCase() &&
        entry.timeMs < decisionTimeMs &&
        entry.code === 0
      ) {
        this.decisions.set(txId, {
          decisionId: id,
          decisionTimeMs,
          evidence: this.evidence({ txId, decisionId: id }),
        });
      }
    }
    return id;
  }

  injectFailure(txId: Hex, code: number): void {
    if (code < 0x1000) {
      throw new RangeError("a handler failure code is 0x1000 or above");
    }
    this.failures.set(txId.toLowerCase() as Hex, code);
  }

  gateway(ref: GatewayRef, behavior: MockGatewayBehavior = "honest"): MockGateway {
    return createMockGateway(this, ref, behavior);
  }
}

function silentError(ref: GatewayRef): Error {
  return new Error(`mock gateway ${ref.id} is silent`);
}

function createMockGateway(
  chain: MockChain,
  ref: GatewayRef,
  initial: MockGatewayBehavior
): MockGateway {
  let behavior = initial;
  return {
    ref,
    setBehavior(next: MockGatewayBehavior): void {
      behavior = next;
    },
    async submit(tx: Uint8Array): Promise<CheckTxAnswer> {
      if (behavior === "silent") {
        throw silentError(ref);
      }
      if (behavior === "censor") {
        return { code: 0, detail: 0 };
      }
      return chain.submit(tx);
    },
    locate(txId: Hex): Promise<TxLocation> {
      if (behavior === "silent") {
        return Promise.reject(silentError(ref));
      }
      if (behavior === "liar") {
        return Promise.resolve({
          status: "included",
          height: chain.head().height + 1_000n,
          index: 0,
          code: 0,
          detail: 0,
          evidence: null,
          decision: null,
        });
      }
      return Promise.resolve(behavior === "censor" ? { status: "absent" } : chain.locate(txId));
    },
    head(): Promise<GatewayHead> {
      return behavior === "silent"
        ? Promise.reject(silentError(ref))
        : Promise.resolve(chain.head());
    },
  };
}

export function createMockChain(options: MockChainOptions = {}): MockChain {
  return new MockChainState(options);
}
