/**
 * AnchorSource: the finalized chain position that P2P events anchor to.
 *
 * Sources: 6529chain `design/decentralize-now.md` §3 and NC2 (until the
 * chain exists, events anchor to "the latest finalized Ethereum block,
 * number and hash", with an anchor-type field; anchors later move to
 * native heights by a rule version), DN12 (several Ethereum providers
 * cross-checked, then a light client), and `p2p-discussion-protocol.md`
 * §3.3 (P33's `anchor` header field; it must not decrease as a key's seq
 * increases).
 *
 * This module defines the versioned `Anchor` shape and an Ethereum source
 * that asks at least two providers of different operators. How the
 * providers are cross-checked is client policy; the design names the goal,
 * not the algorithm:
 *
 * 1. Every provider reports its `finalized` block; providers on another
 *    chain ID are ignored.
 * 2. The candidate is the highest block number that at least
 *    `minAgreement` operators have finalized.
 * 3. Each such provider reports the hash at that number. The hash backed by
 *    the most operators wins if it has at least `minAgreement` and no other
 *    hash ties it; dissenting providers are listed. Otherwise the source
 *    fails closed.
 * 4. The source never returns a lower anchor than one it returned before.
 *
 * The native-height source (P33 §3.6) plugs in beside this one once the
 * gateway read API exists; consumers switch on `Anchor.kind`.
 */
import type { Hex } from "viem";

export const ANCHOR_VERSION = 1;

export interface EthereumFinalizedAnchor {
  readonly v: typeof ANCHOR_VERSION;
  readonly kind: "ethereum-finalized";
  /** EIP-155 chain ID; 1 is Ethereum mainnet. */
  readonly chainId: bigint;
  readonly number: bigint;
  readonly hash: Hex;
  /** Ethereum time, Unix seconds (P28 §2.3). */
  readonly timestamp: bigint;
  /** Operators whose providers agree on (number, hash). */
  readonly reportedBy: readonly string[];
  /** Operators whose providers named another hash at this number. */
  readonly dissent: readonly string[];
}

/** Room for P33's native height anchor; only the Ethereum kind exists today. */
export type Anchor = EthereumFinalizedAnchor;

export type AnchorFailure = "too-few-sources" | "conflict" | "wrong-chain";

export type AnchorResult =
  | { readonly ok: true; readonly anchor: Anchor }
  | { readonly ok: false; readonly reason: AnchorFailure; readonly detail: string };

export interface AnchorSource {
  latest(signal?: AbortSignal): Promise<AnchorResult>;
}

export interface EthereumRpcEndpoint {
  readonly id: string;
  /** VS9: distinct endpoints do not prove distinct operators; agreement counts operators. */
  readonly operator: string;
  readonly url: string;
}

export interface EthereumAnchorOptions {
  readonly endpoints: readonly EthereumRpcEndpoint[];
  readonly minAgreement?: number;
  readonly expectedChainId?: bigint;
  readonly fetch?: typeof fetch;
  readonly timeoutMs?: number;
}

interface BlockRef {
  readonly number: bigint;
  readonly hash: Hex;
  readonly timestamp: bigint;
}

interface Report {
  readonly endpoint: EthereumRpcEndpoint;
  readonly finalized: BlockRef;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const WRONG_CHAIN = "wrong-chain";
const GET_BLOCK = "eth_getBlockByNumber";
const QUANTITY_RE = /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]{0,63})$/;
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

class RpcError extends Error {}

function quantity(value: unknown, what: string): bigint {
  if (typeof value !== "string" || !QUANTITY_RE.test(value)) {
    throw new RpcError(`${what} is not a hex quantity`);
  }
  return BigInt(value);
}

function blockRef(value: unknown): BlockRef {
  if (typeof value !== "object" || value === null) {
    throw new RpcError("block is missing");
  }
  const block = value as Readonly<Record<string, unknown>>;
  const hash = block["hash"];
  if (typeof hash !== "string" || !HASH_RE.test(hash)) {
    throw new RpcError("block hash is malformed");
  }
  return {
    number: quantity(block["number"], "block number"),
    hash: hash.toLowerCase() as Hex,
    timestamp: quantity(block["timestamp"], "block timestamp"),
  };
}

function timeoutSignal(
  timeoutMs: number,
  outer: AbortSignal | undefined
): { readonly signal: AbortSignal; readonly dispose: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("RPC timeout")), timeoutMs);
  const onAbort = (): void => controller.abort(outer?.reason);
  if (outer?.aborted === true) {
    controller.abort(outer.reason);
  } else {
    outer?.addEventListener("abort", onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      outer?.removeEventListener("abort", onAbort);
    },
  };
}

function operatorsOf(reports: readonly Report[]): string[] {
  return [...new Set(reports.map((report) => report.endpoint.operator))];
}

/** Highest block number that at least `min` operators have finalized. */
function candidateNumber(reports: readonly Report[], min: number): bigint | null {
  const best = new Map<string, bigint>();
  for (const { endpoint, finalized } of reports) {
    const known = best.get(endpoint.operator);
    if (known === undefined || finalized.number > known) {
      best.set(endpoint.operator, finalized.number);
    }
  }
  const sorted = [...best.values()].sort((a, b) => (a > b ? -1 : 1));
  return sorted[min - 1] ?? null;
}

interface HashGroup {
  readonly block: BlockRef;
  readonly operators: string[];
}

function groupByHash(entries: readonly { readonly operator: string; readonly block: BlockRef }[]): HashGroup[] {
  const groups = new Map<string, HashGroup>();
  for (const { operator, block } of entries) {
    const group = groups.get(block.hash) ?? { block, operators: [] };
    if (!group.operators.includes(operator)) {
      group.operators.push(operator);
    }
    groups.set(block.hash, group);
  }
  return [...groups.values()].sort((a, b) => b.operators.length - a.operators.length);
}

export function createEthereumFinalizedAnchorSource(options: EthereumAnchorOptions): AnchorSource {
  const minAgreement = options.minAgreement ?? 2;
  const expectedChainId = options.expectedChainId ?? 1n;
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const chainIds = new Map<string, bigint>();
  let requestId = 0;
  let last: EthereumFinalizedAnchor | null = null;

  if (minAgreement < 2) {
    throw new RangeError("DN12 and GW4: anchors need at least two operators");
  }

  async function rpc(
    endpoint: EthereumRpcEndpoint,
    method: string,
    params: readonly unknown[],
    signal: AbortSignal | undefined
  ): Promise<unknown> {
    requestId += 1;
    const request = timeoutSignal(timeoutMs, signal);
    try {
      const response = await doFetch(endpoint.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }),
        credentials: "omit",
        cache: "no-store",
        signal: request.signal,
      });
      if (!response.ok) {
        throw new RpcError(`HTTP ${response.status}`);
      }
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !("result" in body)) {
        throw new RpcError("no result");
      }
      return (body as Readonly<Record<string, unknown>>)["result"];
    } finally {
      request.dispose();
    }
  }

  async function chainIdOf(endpoint: EthereumRpcEndpoint, signal?: AbortSignal): Promise<bigint> {
    const known = chainIds.get(endpoint.id);
    if (known !== undefined) {
      return known;
    }
    const id = quantity(await rpc(endpoint, "eth_chainId", [], signal), "chain ID");
    chainIds.set(endpoint.id, id);
    return id;
  }

  async function reportOf(
    endpoint: EthereumRpcEndpoint,
    signal?: AbortSignal
  ): Promise<Report | typeof WRONG_CHAIN | null> {
    try {
      if ((await chainIdOf(endpoint, signal)) !== expectedChainId) {
        return WRONG_CHAIN;
      }
      const finalized = blockRef(await rpc(endpoint, GET_BLOCK, ["finalized", false], signal));
      return { endpoint, finalized };
    } catch {
      return null;
    }
  }

  async function blockAt(report: Report, number: bigint, signal?: AbortSignal): Promise<BlockRef | null> {
    if (report.finalized.number === number) {
      return report.finalized;
    }
    try {
      const block = blockRef(
        await rpc(report.endpoint, GET_BLOCK, [`0x${number.toString(16)}`, false], signal)
      );
      return block.number === number ? block : null;
    } catch {
      return null;
    }
  }

  function keepMonotonic(anchor: EthereumFinalizedAnchor): AnchorResult {
    if (last !== null && anchor.number < last.number) {
      return { ok: true, anchor: last };
    }
    last = anchor;
    return { ok: true, anchor };
  }

  return {
    async latest(signal?: AbortSignal): Promise<AnchorResult> {
      const outcomes = await Promise.all(options.endpoints.map((endpoint) => reportOf(endpoint, signal)));
      const reports = outcomes.filter((o): o is Report => o !== null && o !== WRONG_CHAIN);
      if (reports.length === 0 && outcomes.includes(WRONG_CHAIN)) {
        return { ok: false, reason: WRONG_CHAIN, detail: `no provider is on chain ${expectedChainId.toString()}` };
      }
      const number = candidateNumber(reports, minAgreement);
      if (number === null) {
        return {
          ok: false,
          reason: "too-few-sources",
          detail: `${operatorsOf(reports).length} of ${minAgreement} operators answered`,
        };
      }
      const eligible = reports.filter((r) => r.finalized.number >= number);
      const blocks = await Promise.all(eligible.map((r) => blockAt(r, number, signal)));
      const entries = eligible.flatMap((r, i) => {
        const block = blocks[i];
        return block === null || block === undefined ? [] : [{ operator: r.endpoint.operator, block }];
      });
      const [top, second] = groupByHash(entries);
      if (top === undefined || top.operators.length < minAgreement || top.operators.length === second?.operators.length) {
        return { ok: false, reason: "conflict", detail: `no hash at block ${number.toString()} has ${minAgreement} operators` };
      }
      const dissent = entries
        .filter((entry) => entry.block.hash !== top.block.hash)
        .map((entry) => entry.operator);
      return keepMonotonic({
        v: ANCHOR_VERSION,
        kind: "ethereum-finalized",
        chainId: expectedChainId,
        number,
        hash: top.block.hash,
        timestamp: top.block.timestamp,
        reportedBy: top.operators,
        dissent: [...new Set(dissent)],
      });
    },
  };
}
