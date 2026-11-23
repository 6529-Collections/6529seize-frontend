/**
 * @jest-environment node
 */
import { hashTypedData } from "viem";
import { registryPins } from "@/lib/provenance-core/config/registries";
import { buildGovernanceSafeTxs } from "@/lib/provenance-core/governance";
import {
  ensureChain,
  isUserRejection,
  signWithWallet,
} from "@/lib/provenance-governance/wallet";

const SIGNER = "0x56ec02E81f5Cd36E49cA5382A5f55a00A4906F94";
const pin = registryPins[1]!;

/** A wallet that records requests. It signs nothing: the "signature" is a fixed placeholder. */
function mockWallet(
  opts: { chain?: number; unknownChain?: boolean; reject?: boolean } = {}
) {
  let chain = opts.chain ?? 1;
  const calls: { method: string; params?: unknown }[] = [];
  return {
    calls,
    provider: {
      request: async ({
        method,
        params,
      }: {
        method: string;
        params?: unknown;
      }) => {
        calls.push({ method, params });
        switch (method) {
          case "eth_chainId":
            return `0x${chain.toString(16)}`;
          case "wallet_switchEthereumChain":
            if (
              opts.unknownChain &&
              !calls.some((c) => c.method === "wallet_addEthereumChain")
            ) {
              throw Object.assign(new Error("Unrecognized chain"), {
                code: 4902,
              });
            }
            chain = 11155111;
            return null;
          case "wallet_addEthereumChain":
            chain = 11155111;
            return null;
          case "eth_signTypedData_v4":
            if (opts.reject)
              throw Object.assign(new Error("User rejected"), { code: 4001 });
            return "0xplaceholder";
          default:
            throw new Error(method);
        }
      },
    },
  };
}

describe("ensureChain", () => {
  it("switches the wallet to Sepolia", async () => {
    const w = mockWallet();
    await ensureChain(w.provider, 11155111);
    expect(w.calls.map((c) => c.method)).toEqual([
      "eth_chainId",
      "wallet_switchEthereumChain",
      "eth_chainId",
    ]);
  });

  it("adds Sepolia when the wallet does not know it", async () => {
    const w = mockWallet({ unknownChain: true });
    await ensureChain(w.provider, 11155111);
    expect(w.calls.map((c) => c.method)).toContain("wallet_addEthereumChain");
  });

  it("does nothing on the right chain", async () => {
    const w = mockWallet({ chain: 11155111 });
    await ensureChain(w.provider, 11155111);
    expect(w.calls).toHaveLength(1);
  });
});

describe("signWithWallet", () => {
  const [g] = buildGovernanceSafeTxs(pin, [{ kind: "freeze" }], 19n);

  it("asks for eth_signTypedData_v4 over the SafeTx whose hash the page shows", async () => {
    const w = mockWallet();
    expect(await signWithWallet(w.provider, SIGNER, pin, g!)).toBe(
      "0xplaceholder"
    );
    const req = w.calls.find((c) => c.method === "eth_signTypedData_v4")!;
    const [signer, json] = req.params as [string, string];
    expect(signer).toBe(SIGNER);
    const typed = JSON.parse(json);
    expect(typed.domain).toEqual({
      chainId: 11155111,
      verifyingContract: pin.safe,
    });
    const { EIP712Domain: _domain, ...types } = typed.types;
    expect(
      hashTypedData({
        domain: typed.domain,
        types,
        primaryType: "SafeTx",
        message: typed.message,
      })
    ).toBe(g!.hash);
  });

  it("reports a declined signature as a rejection", async () => {
    const w = mockWallet({ reject: true });
    const error = await signWithWallet(w.provider, SIGNER, pin, g!).catch(
      (e: unknown) => e
    );
    expect(isUserRejection(error)).toBe(true);
  });
});
