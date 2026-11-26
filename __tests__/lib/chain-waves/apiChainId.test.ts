import { apiChainId } from "@/lib/chain-waves/entryGateway";

const ID = `0x${"3c".repeat(32)}`;

describe("apiChainId", () => {
  it("takes the chain_id 6529.io's API gives, in lowercase", () => {
    expect(apiChainId({ id: "a", chain_id: ID })).toBe(ID);
    expect(apiChainId({ chain_id: ID.toUpperCase().replace("0X", "0x") })).toBe(
      ID
    );
  });

  it.each([
    ["absent, before the API sends it", { id: "a" }],
    ["null, when the API doesn't know it yet", { chain_id: null }],
    ["not 32 bytes", { chain_id: "0x1234" }],
    ["not hex", { chain_id: `0x${"zz".repeat(32)}` }],
    ["not a string", { chain_id: 7 }],
    ["no record", null],
  ])("is null when %s", (_why, record) => {
    expect(apiChainId(record)).toBeNull();
  });
});
