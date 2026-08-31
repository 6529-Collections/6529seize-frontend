import { parseGroupWalletCsv } from "@/helpers/groups/group-wallet-csv";

describe("parseGroupWalletCsv", () => {
  it("accepts common CSV delimiters and deduplicates wallets", () => {
    expect(
      parseGroupWalletCsv(`wallet
0x1111111111111111111111111111111111111111,
0x2222222222222222222222222222222222222222;
0x1111111111111111111111111111111111111111`)
    ).toEqual([
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
    ]);
  });

  it("ignores malformed and non-Ethereum values", () => {
    expect(
      parseGroupWalletCsv(
        "not-a-wallet,0x1234,1111111111111111111111111111111111111111"
      )
    ).toEqual([]);
  });

  it("normalizes BOM-prefixed, quoted, and mixed-case addresses", () => {
    expect(
      parseGroupWalletCsv(
        '\uFEFF"0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",' +
          '"0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"'
      )
    ).toEqual([
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ]);
  });
});
