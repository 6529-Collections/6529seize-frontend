import { formatDecodedValue } from "@/components/desktop/walletTransactionFormat";

describe("formatDecodedValue", () => {
  it("formats tuple fields by their own types, nested tuples included", () => {
    const text = formatDecodedValue(
      "en-US",
      "(address,uint256,(uint16,bytes32))",
      {
        owner: "0xab5801a7d398351b8be11c439e05c5b3259aec9b",
        amount: 1_234_567n,
        hash: { algorithm: 2n, digest: `0x${"11".repeat(32)}` },
      },
      [
        { name: "owner", type: "address", rule: { any: true } },
        { name: "amount", type: "uint256", rule: { any: true } },
        {
          name: "hash",
          type: "(uint16,bytes32)",
          rule: { any: true },
          components: [
            { name: "algorithm", type: "uint16", rule: { any: true } },
            { name: "digest", type: "bytes32", rule: { any: true } },
          ],
        },
      ]
    );
    expect(text).toBe(
      `(owner: 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B, amount: 1,234,567, hash: (algorithm: 2, digest: 0x${"11".repeat(32)}))`
    );
  });
});
