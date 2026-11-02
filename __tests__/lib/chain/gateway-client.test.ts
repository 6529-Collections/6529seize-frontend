/**
 * @jest-environment node
 */
import { keccak256, stringToBytes } from "viem";

import { networkId } from "@/lib/chain/codec/ids";
import { createGatewayClient, GatewayConfigError, selectGateways } from "@/lib/chain/gateway/client";
import { createMockChain, MOCK_GENESIS_TIME_MS, type MockChain } from "@/lib/chain/mock/chain";
import { createMockProofVerifier } from "@/lib/chain/mock/proof-verifier";
import type { ChainStatus } from "@/lib/chain/status-ladder";

import { signedVote, TEST_COMPETITION } from "./fixtures/signed-tx";

/** Each poll's sleep produces one block, so tests run without timers. */
function blockSleep(chain: MockChain, onBlock?: () => void) {
  return (): Promise<void> => {
    chain.produceBlock();
    onBlock?.();
    return Promise.resolve();
  };
}

function recorder() {
  const statuses: ChainStatus[] = [];
  return {
    statuses,
    onStatus: (status: ChainStatus) => statuses.push(status),
    labels: () =>
      statuses.map((s) => (s.overlay === null ? s.label : `${s.label}/${s.overlay}`)),
  };
}

describe("gateway client (P41 §5.1 GW1-GW7)", () => {
  it("refuses a gateway list with fewer than two operators (GW7)", () => {
    const chain = createMockChain();
    const gateways = [
      chain.gateway({ id: "a", operator: "same" }),
      chain.gateway({ id: "b", operator: "same" }),
    ];
    expect(() => createGatewayClient({ gateways })).toThrow(GatewayConfigError);
    const split = selectGateways(
      [...gateways, chain.gateway({ id: "c", operator: "other" })],
      2
    );
    expect(split.primary.map((g) => g.ref.id)).toEqual(["a", "c"]);
    expect(split.reserve.map((g) => g.ref.id)).toEqual(["b"]);
  });

  it("walks Signed -> Submitted -> Committed -> Finalized -> In decision with a verifier", async () => {
    const chain = createMockChain();
    let settled = false;
    const sleep = blockSleep(chain, () => {
      const head = chain.head();
      if (!settled && head.height >= 3n) {
        chain.settleDecision(TEST_COMPETITION, head.timeMs);
        settled = true;
      }
    });
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "a", operator: "op-a" }),
        chain.gateway({ id: "b", operator: "op-b" }),
      ],
      verifier: createMockProofVerifier(chain),
      sleep,
    });
    const { bytes, txId } = await signedVote();
    const log = recorder();
    const final = await client.track(bytes, { onStatus: log.onStatus, awaitDecision: true });
    expect(log.labels()).toEqual(["signed", "submitted", "committed", "finalized", "in-decision"]);
    expect(log.statuses[1]?.reportedBy).toBe(2);
    expect(final).toMatchObject({ txId, label: "in-decision", verified: true });
    expect(final.decision?.decisionTimeMs).toBeGreaterThan(MOCK_GENESIS_TIME_MS);
  });

  it("stops at Committed (reported by 2) without a verifier (GW5)", async () => {
    const chain = createMockChain();
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "a", operator: "op-a" }),
        chain.gateway({ id: "b", operator: "op-b" }),
      ],
      sleep: blockSleep(chain),
    });
    const { bytes } = await signedVote();
    const final = await client.track(bytes, { awaitDecision: true });
    expect(final).toMatchObject({ label: "committed", verified: false, reportedBy: 2 });
  });

  it("swaps a silent gateway for a reserve and resubmits (GW4)", async () => {
    const chain = createMockChain();
    const reserve = chain.gateway({ id: "c", operator: "op-c" });
    const submitted = jest.spyOn(reserve, "submit");
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "a", operator: "op-a" }, "silent"),
        chain.gateway({ id: "b", operator: "op-b" }),
        reserve,
      ],
      sleep: blockSleep(chain),
    });
    const { bytes } = await signedVote();
    const final = await client.track(bytes);
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(final).toMatchObject({ label: "committed", reportedBy: 2 });
  });

  it("rebroadcasts when censoring gateways drop the bytes, then reports expiry", async () => {
    const chain = createMockChain();
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "a", operator: "op-a" }, "censor"),
        chain.gateway({ id: "b", operator: "op-b" }, "censor"),
      ],
      sleep: blockSleep(chain),
    });
    const { bytes } = await signedVote({ expiresAt: MOCK_GENESIS_TIME_MS + 60_000n });
    const log = recorder();
    const final = await client.track(bytes, { onStatus: log.onStatus });
    expect(log.labels()).toEqual(["signed", "submitted", "submitted/expired"]);
    expect(final).toMatchObject({ overlay: "expired", verified: false, reportedBy: 2 });
  });

  it("is not fooled by a lying gateway when it can verify", async () => {
    const chain = createMockChain();
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "liar", operator: "op-l" }, "liar"),
        chain.gateway({ id: "b", operator: "op-b" }),
      ],
      verifier: createMockProofVerifier(chain),
      sleep: blockSleep(chain),
    });
    const { bytes } = await signedVote();
    const final = await client.track(bytes);
    const truth = chain.locate(final.txId);
    expect(truth.status).toBe("included");
    expect(final).toMatchObject({ label: "finalized", verified: true });
    expect(final.inclusion?.height).toBe(truth.status === "included" ? truth.height : -1n);
  });

  it("shows a lie only as a conflicting, unverified claim", async () => {
    const chain = createMockChain();
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "liar", operator: "op-l" }, "liar"),
        chain.gateway({ id: "b", operator: "op-b" }),
      ],
      sleep: blockSleep(chain),
    });
    const { bytes } = await signedVote();
    const final = await client.track(bytes, { maxPolls: 4 });
    expect(final).toMatchObject({ label: "committed", verified: false, conflict: true, reportedBy: 1 });
  });

  it("reports Rejected when every gateway refuses", async () => {
    const chain = createMockChain();
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "a", operator: "op-a" }),
        chain.gateway({ id: "b", operator: "op-b" }),
      ],
      sleep: blockSleep(chain),
    });
    const otherNetwork = { chainId: "6529-devnet-2", networkId: networkId("6529-devnet-2", keccak256(stringToBytes("x"))) };
    const { bytes } = await signedVote({ network: otherNetwork });
    const final = await client.track(bytes);
    expect(final).toMatchObject({ label: "signed", overlay: "rejected" });
  });

  it("reports Failed for an injected handler failure, verified", async () => {
    const chain = createMockChain();
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "a", operator: "op-a" }),
        chain.gateway({ id: "b", operator: "op-b" }),
      ],
      verifier: createMockProofVerifier(chain),
      sleep: blockSleep(chain),
    });
    const { bytes, txId } = await signedVote();
    chain.injectFailure(txId, 0x2603);
    const final = await client.track(bytes);
    expect(final).toMatchObject({ overlay: "failed", verified: true, resultCode: 0x2603 });
  });

  it("reports Replaced when another transaction took the nonce", async () => {
    const chain = createMockChain();
    const client = createGatewayClient({
      gateways: [
        chain.gateway({ id: "a", operator: "op-a" }),
        chain.gateway({ id: "b", operator: "op-b" }),
      ],
      sleep: blockSleep(chain),
    });
    const first = await signedVote({ amount: 1n });
    const second = await signedVote({ amount: 2n });
    await chain.submit(first.bytes);
    const final = await client.track(second.bytes);
    expect(final).toMatchObject({ overlay: "replaced", reportedBy: 2 });
  });
});

describe("mock chain admission", () => {
  it("checks signatures, nonces and duplicates", async () => {
    const chain = createMockChain();
    const vote = await signedVote();
    expect(await chain.submit(vote.bytes)).toEqual({ code: 0, detail: 0 });
    expect(await chain.submit(vote.bytes)).toEqual({ code: 0, detail: 0 });
    chain.produceBlock();
    expect((await chain.submit(vote.bytes)).code).toBe(0x0301);
    const tampered = vote.bytes.slice();
    const rByte = tampered.length - 4 - 60;
    tampered[rByte] = (tampered[rByte] ?? 0) ^ 0x01;
    expect((await chain.submit(tampered)).code).toBe(0x0201);
    expect((await chain.submit(Uint8Array.of(1, 2, 3))).code).toBe(0x0101);
  });

  it("refuses an expired transaction and settles only after D", async () => {
    const chain = createMockChain();
    expect(() => chain.settleDecision(TEST_COMPETITION, MOCK_GENESIS_TIME_MS + 1n)).toThrow();
    const late = await signedVote({ expiresAt: MOCK_GENESIS_TIME_MS + 1n });
    chain.produceBlock();
    expect((await chain.submit(late.bytes)).code).toBe(0x0303);
  });
});
