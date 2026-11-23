/**
 * @jest-environment node
 */
// Runs the governance flow against an Anvil fork of Sepolia when PROVENANCE_FORK_RPC is set:
//
//   anvil --fork-url <sepolia rpc> --chain-id 31337 --port 8546
//   PROVENANCE_FORK_RPC=http://127.0.0.1:8546 6529 run test __tests__/lib/provenance-governance/fork.test.ts
//
// It builds and checks SafeTxs against the real test Safe and registry state, simulates them with
// eth_simulateV1, signs with a mock wallet and posts to a mock service. No key signs anything and
// nothing reaches Sepolia or the Safe Transaction Service.
import type { Address } from "viem";
import { makeClient } from "@/lib/provenance-core/client";
import { registryPins } from "@/lib/provenance-core/config/registries";
import {
  buildGovernanceSafeTxs,
  checkBeforeSigning,
  proposeToTxService,
} from "@/lib/provenance-core/governance";
import { readSafe } from "@/lib/provenance-core/safeInfo";
import { simulatePlan } from "@/lib/provenance-core/simulate";
import { signWithWallet } from "@/lib/provenance-governance/wallet";

const RPC = process.env["PROVENANCE_FORK_RPC"];
const run = RPC ? describe : describe.skip;
const pin = { ...registryPins[1]!, chainId: 31337 };

run("governance flow on a fork", () => {
  jest.setTimeout(120_000);
  const client = makeClient(31337, RPC ?? "");

  it("checks, simulates, signs and proposes a publisher grant and a registration batch", async () => {
    const safe = (await readSafe(client, pin.safe))!;
    const txs = buildGovernanceSafeTxs(
      pin,
      [
        { kind: "registerRecordType", literal: "FORK_TYPE_A" },
        { kind: "registerRecordType", literal: "FORK_TYPE_B" },
        {
          kind: "setPublisher",
          publisher: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          authorized: true,
        },
      ],
      safe.nonce
    );
    // A publisher grant is high impact but may share a batch (6529 Desktop's SafeTx schema).
    expect(txs.map((g) => [g.risk, g.tx.operation, g.actions.length])).toEqual([
      ["high", 1, 3],
    ]);

    const signer = safe.owners[0] as Address;
    for (const g of txs) {
      const check = await checkBeforeSigning(client, pin, signer, g);
      expect(check.problems).toEqual([]);
    }
    const sim = await simulatePlan(
      client,
      pin.registry,
      {
        kind: "safe",
        safe: pin.safe,
        owners: safe.owners,
        nonce: safe.nonce,
        chainId: 31337,
      },
      txs.map((g) => ({ actions: g.actions })),
      30_000_000n
    );
    expect(sim.txs.map((t) => t.ok)).toEqual([true]);
    expect(sim.txs.map((t) => t.safeTxHash)).toEqual(txs.map((g) => g.hash));

    const wallet = {
      request: async ({ method }: { method: string }) =>
        method === "eth_chainId" ? "0x7a69" : "0xplaceholder",
    };
    const signature = await signWithWallet(wallet, signer, pin, txs[0]!);
    const posted: string[] = [];
    await proposeToTxService({
      serviceUrl: "https://service.invalid",
      pin,
      g: txs[0]!,
      sender: signer,
      signature,
      fetchImpl: (async (url: string) => {
        posted.push(url);
        return new Response("", { status: 201 });
      }) as unknown as typeof fetch,
    });
    expect(posted).toEqual([
      `https://service.invalid/api/v1/safes/${pin.safe}/multisig-transactions/`,
    ]);
  });
});
