import { DELEGATION_ABI } from "@/abis/abis";
import {
  getDelegationsFromData,
  getParams,
  getReadParams,
} from "@/components/delegation/CollectionDelegation.utils";
import {
  CONSOLIDATION_USE_CASE,
  DELEGATION_USE_CASES,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "@/components/delegation/delegation-constants";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants/constants";

describe("CollectionDelegation utility functions", () => {
  it("builds params with extra use cases", () => {
    const res = getParams("0x1", "0x2", "fn", [{ use_case: 1 }]);
    expect(res[0]).toEqual({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "fn",
      args: ["0x1", "0x2", 1],
    });
    const codes = res.slice(1).map((p) => p.args[2]);
    expect(codes).toEqual([
      PRIMARY_ADDRESS_USE_CASE.use_case,
      SUB_DELEGATION_USE_CASE.use_case,
      CONSOLIDATION_USE_CASE.use_case,
    ]);
  });

  it("getReadParams defaults to DELEGATION_USE_CASES", () => {
    const res = getReadParams("0x1", "0x2", "fn");
    expect(res.length).toBe(DELEGATION_USE_CASES.length + 3);
  });

  it("getDelegationsFromData parses delegations", () => {
    const data = [{ result: [["0x4"], [NEVER_DATE + 1], [true], [1]] }];
    const res = getDelegationsFromData(data);
    expect(res[0]?.wallets[0].expiry).toContain("active - non-expiring");
  });

  it("includes formatted expiry date for active delegations", () => {
    const future = NEVER_DATE - 12345;
    const data = [{ result: [["0x9"], [future], [true], [1]] }];
    const res = getDelegationsFromData(data);
    const expected = new Date(future * 1000).toISOString().slice(0, 10);
    expect(res[0]?.wallets[0].expiry).toBe(`active - expires ${expected}`);
  });

  it("returns empty when no result present", () => {
    const res = getDelegationsFromData([{ result: null } as any]);
    expect(res).toEqual([]);
  });

  it("marks expired delegations correctly", () => {
    const past = Math.floor(Date.now() / 1000) - 100;
    const data = [{ result: [["0x1"], [past], [false], [1]] }];
    const res = getDelegationsFromData(data);
    expect(res[0]?.wallets[0].expiry).toContain("expired");
  });

  it("treats primary and higher reserved use cases as non-expiring", () => {
    const past = Math.floor(Date.now() / 1000) - 100;
    const data = Array.from(
      { length: CONSOLIDATION_USE_CASE.index + 1 },
      () => ({ result: null })
    ) as any[];

    data[PRIMARY_ADDRESS_USE_CASE.index] = {
      result: [["0x1"], [past], [true], [1]],
    };
    data[SUB_DELEGATION_USE_CASE.index] = {
      result: [["0x2"], [past], [true], [1]],
    };
    data[CONSOLIDATION_USE_CASE.index] = {
      result: [["0x3"], [past], [true], [1]],
    };

    const res = getDelegationsFromData(data);

    const primary = res.find(
      (d) => d.useCase.use_case === PRIMARY_ADDRESS_USE_CASE.use_case
    );
    const subDelegation = res.find(
      (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
    );
    const consolidation = res.find(
      (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
    );

    expect(primary?.wallets[0].expiry).toBe("active - non-expiring");
    expect(subDelegation?.wallets[0].expiry).toBe("active - non-expiring");
    expect(consolidation?.wallets[0].expiry).toBe("active - non-expiring");
  });
});
