/**
 * @jest-environment node
 */
import type { Hex } from "viem";

import {
  createEthereumFinalizedAnchorSource,
  type AnchorFloorStore,
  type EthereumFinalizedAnchor,
  type EthereumRpcEndpoint,
} from "@/lib/chain/anchor/anchor-source";

interface FakeNode {
  chainId?: bigint;
  finalized: bigint;
  /** Hash a node reports per block number; defaults to the canonical one. */
  hashes?: Readonly<Record<string, Hex>>;
  down?: boolean;
  /** Answers `finalized` but fails when asked for a block by number. */
  failByNumber?: boolean;
}

const canonical = (n: bigint): Hex => `0x${n.toString(16).padStart(64, "0")}`;

function fakeFetch(nodes: Readonly<Record<string, FakeNode>>) {
  const calls: string[] = [];
  const impl = (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const node = nodes[url];
    const request = JSON.parse(typeof init?.body === "string" ? init.body : "{}") as {
      id: number;
      method: string;
      params: unknown[];
    };
    calls.push(`${url} ${request.method} ${JSON.stringify(request.params)}`);
    if (node === undefined || node.down === true) {
      return Promise.reject(new Error("connection refused"));
    }
    const block = (n: bigint) => ({
      number: `0x${n.toString(16)}`,
      hash: node.hashes?.[n.toString()] ?? canonical(n),
      timestamp: `0x${(1_800_000_000n + n * 12n).toString(16)}`,
    });
    let result: unknown;
    const tag = request.params[0];
    if (request.method === "eth_chainId") {
      result = `0x${(node.chainId ?? 1n).toString(16)}`;
    } else if (tag === "finalized") {
      result = block(node.finalized);
    } else if (node.failByNumber === true) {
      return Promise.resolve(new Response("{}", { status: 502 }));
    } else {
      result = block(BigInt(String(tag)));
    }
    return Promise.resolve(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }), {
        headers: { "content-type": "application/json" },
      })
    );
  };
  return { fetch: impl as typeof fetch, calls };
}

const endpoint = (id: string, operator = `op-${id}`): EthereumRpcEndpoint => ({
  id,
  operator,
  url: `https://rpc.invalid/${id}`,
});

describe("Ethereum finalized anchor source (NC2, DN12)", () => {
  it("anchors to the highest block two operators have finalized", async () => {
    const { fetch, calls } = fakeFetch({
      "https://rpc.invalid/a": { finalized: 100n },
      "https://rpc.invalid/b": { finalized: 96n },
      "https://rpc.invalid/c": { finalized: 90n },
    });
    const source = createEthereumFinalizedAnchorSource({
      endpoints: [endpoint("a"), endpoint("b"), endpoint("c")],
      fetch,
    });
    const result = await source.latest();
    expect(result).toEqual({
      ok: true,
      anchor: {
        v: 1,
        kind: "ethereum-finalized",
        chainId: 1n,
        number: 96n,
        hash: canonical(96n),
        timestamp: 1_800_000_000n + 96n * 12n,
        reportedBy: ["op-a", "op-b"],
        dissent: [],
      },
      held: false,
    });
    expect(calls).toContain('https://rpc.invalid/a eth_getBlockByNumber ["0x60",false]');
  });

  it("needs two operators, not two endpoints", async () => {
    const { fetch } = fakeFetch({
      "https://rpc.invalid/a": { finalized: 100n },
      "https://rpc.invalid/b": { finalized: 100n },
      "https://rpc.invalid/c": { finalized: 100n, down: true },
    });
    const source = createEthereumFinalizedAnchorSource({
      endpoints: [endpoint("a", "same"), endpoint("b", "same"), endpoint("c")],
      fetch,
    });
    expect(await source.latest()).toMatchObject({ ok: false, reason: "too-few-sources" });
    expect(() => createEthereumFinalizedAnchorSource({ endpoints: [], minAgreement: 1 })).toThrow(
      RangeError
    );
  });

  it("outvotes one lying provider and lists it as dissent", async () => {
    const { fetch } = fakeFetch({
      "https://rpc.invalid/a": { finalized: 100n },
      "https://rpc.invalid/b": { finalized: 100n },
      "https://rpc.invalid/liar": { finalized: 100n, hashes: { "100": `0x${"ee".repeat(32)}` } },
    });
    const source = createEthereumFinalizedAnchorSource({
      endpoints: [endpoint("a"), endpoint("liar"), endpoint("b")],
      fetch,
    });
    const result = await source.latest();
    expect(result).toMatchObject({ ok: true, anchor: { number: 100n, hash: canonical(100n), dissent: ["op-liar"] } });
  });

  it("fails closed on a tie", async () => {
    const { fetch } = fakeFetch({
      "https://rpc.invalid/a": { finalized: 100n },
      "https://rpc.invalid/b": { finalized: 100n, hashes: { "100": `0x${"ee".repeat(32)}` } },
    });
    const source = createEthereumFinalizedAnchorSource({ endpoints: [endpoint("a"), endpoint("b")], fetch });
    expect(await source.latest()).toMatchObject({ ok: false, reason: "conflict" });
  });

  it("ignores providers on another chain", async () => {
    const { fetch } = fakeFetch({
      "https://rpc.invalid/a": { finalized: 100n, chainId: 11155111n },
      "https://rpc.invalid/b": { finalized: 100n, chainId: 11155111n },
    });
    const source = createEthereumFinalizedAnchorSource({ endpoints: [endpoint("a"), endpoint("b")], fetch });
    expect(await source.latest()).toMatchObject({ ok: false, reason: "wrong-chain" });
  });

  it("never returns a lower anchor than before (P33 §3.3)", async () => {
    const nodes: Record<string, FakeNode> = {
      "https://rpc.invalid/a": { finalized: 100n },
      "https://rpc.invalid/b": { finalized: 100n },
    };
    const { fetch } = fakeFetch(nodes);
    const source = createEthereumFinalizedAnchorSource({ endpoints: [endpoint("a"), endpoint("b")], fetch });
    expect(await source.latest()).toMatchObject({ ok: true, anchor: { number: 100n } });
    nodes["https://rpc.invalid/a"] = { finalized: 90n };
    nodes["https://rpc.invalid/b"] = { finalized: 90n };
    expect(await source.latest()).toMatchObject({ ok: true, held: true, anchor: { number: 100n } });
  });

  it("counts failed providers as non-agreement, never lowering the threshold", async () => {
    const nodes: Record<string, FakeNode> = {
      "https://rpc.invalid/a": { finalized: 100n },
      "https://rpc.invalid/b": { finalized: 100n },
      "https://rpc.invalid/c": { finalized: 100n, down: true },
      "https://rpc.invalid/d": { finalized: 100n, down: true },
    };
    const { fetch } = fakeFetch(nodes);
    const four = [endpoint("a"), endpoint("b"), endpoint("c"), endpoint("d")];
    // DN12: one or more providers down, two operators still agree.
    expect(
      await createEthereumFinalizedAnchorSource({ endpoints: four, fetch }).latest()
    ).toMatchObject({ ok: true, anchor: { reportedBy: ["op-a", "op-b"] } });
    // A threshold of three is not met by the two survivors.
    expect(
      await createEthereumFinalizedAnchorSource({ endpoints: four, fetch, minAgreement: 3 }).latest()
    ).toMatchObject({ ok: false, reason: "too-few-sources" });
    // Only one survivor cannot reach two.
    nodes["https://rpc.invalid/b"] = { finalized: 100n, down: true };
    expect(
      await createEthereumFinalizedAnchorSource({ endpoints: four, fetch }).latest()
    ).toMatchObject({ ok: false, reason: "too-few-sources" });
  });

  it("drops a provider that fails the hash lookup at the candidate block", async () => {
    const { fetch } = fakeFetch({
      "https://rpc.invalid/a": { finalized: 100n, failByNumber: true },
      "https://rpc.invalid/b": { finalized: 96n },
      "https://rpc.invalid/c": { finalized: 96n },
    });
    const twoLeft = createEthereumFinalizedAnchorSource({
      endpoints: [endpoint("a"), endpoint("b"), endpoint("c")],
      fetch,
    });
    expect(await twoLeft.latest()).toMatchObject({
      ok: true,
      anchor: { number: 96n, reportedBy: ["op-b", "op-c"] },
    });
    const oneLeft = createEthereumFinalizedAnchorSource({
      endpoints: [endpoint("a"), endpoint("b")],
      fetch,
    });
    expect(await oneLeft.latest()).toMatchObject({ ok: false, reason: "too-few-sources" });
  });

  it("keeps the floor in an injected store and returns it frozen, labelled held", async () => {
    let stored: EthereumFinalizedAnchor | null = null;
    const store: AnchorFloorStore = {
      read: () => Promise.resolve(stored),
      write: (anchor) => {
        stored = anchor;
        return Promise.resolve();
      },
    };
    const nodes: Record<string, FakeNode> = {
      "https://rpc.invalid/a": { finalized: 100n },
      "https://rpc.invalid/b": { finalized: 100n },
    };
    const { fetch } = fakeFetch(nodes);
    const endpoints = [endpoint("a"), endpoint("b")];
    const first = await createEthereumFinalizedAnchorSource({ endpoints, fetch, floor: store }).latest();
    expect(first).toMatchObject({ ok: true, held: false, anchor: { number: 100n } });
    expect(first.ok && Object.isFrozen(first.anchor) && Object.isFrozen(first.anchor.reportedBy)).toBe(true);
    nodes["https://rpc.invalid/a"] = { finalized: 90n };
    nodes["https://rpc.invalid/b"] = { finalized: 90n };
    // A fresh instance reads the floor instead of accepting the older block.
    const second = await createEthereumFinalizedAnchorSource({ endpoints, fetch, floor: store }).latest();
    expect(second).toMatchObject({
      ok: true,
      held: true,
      anchor: { number: 100n, hash: canonical(100n), reportedBy: ["op-a", "op-b"] },
    });
  });

  it("asks every provider for its chain ID on every fetch", async () => {
    const nodes: Record<string, FakeNode> = {
      "https://rpc.invalid/a": { finalized: 100n },
      "https://rpc.invalid/b": { finalized: 100n },
    };
    const { fetch } = fakeFetch(nodes);
    const source = createEthereumFinalizedAnchorSource({ endpoints: [endpoint("a"), endpoint("b")], fetch });
    expect(await source.latest()).toMatchObject({ ok: true });
    nodes["https://rpc.invalid/b"] = { finalized: 101n, chainId: 5n };
    expect(await source.latest()).toMatchObject({ ok: false, reason: "too-few-sources" });
  });
});
