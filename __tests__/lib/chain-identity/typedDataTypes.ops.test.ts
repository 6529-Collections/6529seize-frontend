import { pinnedTypes } from "@/lib/chain-identity/typedDataTypes";
import row7 from "./fixtures/ops-row7-bodies.json";

/**
 * The bodies this site pins against what a rule-version-7 devnet's gateway
 * answered at `GET /v1/ops` (each operation's name, primary type and body
 * fields; nested structs aren't in that answer). A pinned body that differs
 * from the chain's in a name, a type or the order makes a digest the chain
 * won't take.
 */
describe("the pinned EIP-712 bodies against a rule version 7 chain's /v1/ops", () => {
  it("covers rule version 7", () => {
    expect(row7.ruleVersion).toBe(7);
    expect(row7.ops).toHaveLength(34);
  });

  it.each(row7.ops.filter((op) => pinnedTypes(op.primaryType) !== null))(
    "pins $name as the chain does",
    (op) => {
      expect(pinnedTypes(op.primaryType)?.[`${op.primaryType}Body`]).toEqual(
        op.body
      );
    }
  );

  it("leaves unpinned only the operations this site never signs", () => {
    expect(
      row7.ops
        .filter((op) => pinnedTypes(op.primaryType) === null)
        .map((op) => op.name)
    ).toEqual([
      "NONCE_SKIP",
      "AWARD_DELIVERY_SET",
      "AWARD_CLAIM",
      "SETTLEMENT_REQUEST",
      "VOTE_RELEASE",
    ]);
  });
});
