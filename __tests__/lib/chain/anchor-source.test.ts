/**
 * @jest-environment node
 */
import type { Hex } from "viem";

import {
  createEthereumFinalizedAnchorSource,
  type EthereumRpcEndpoint,
} from "@/lib/chain/anchor/anchor-source";

interface FakeNode {
  chainId?: bigint;
  finalized: bigint;
  /** Hash a node reports per block number; defaults to the canonical one. */
  hashes?: Readonly<Record<string, Hex>>;
  down?: boolean;
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
    if (request.method === "eth_chainId") {
      result = `0x${(node.chainId ?? 1n).toString(16)}`;
    } else {
      const tag = request.params[0];
      result = tag === "finalized" ? block(node.finalized) : block(BigInt(String(tag)));
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
    expect(await source.latest()).toMatchObject({ ok: true, anchor: { number: 100n } });
  });
});
