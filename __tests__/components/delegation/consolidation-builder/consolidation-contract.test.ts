import { DELEGATION_ABI } from "@/abis/abis";
import {
  getConsolidationStepWriteParams,
  getLinkStatusReadParams,
  getRegisteredLinkKeys,
} from "@/components/delegation/consolidation-builder/consolidation-contract";
import { toDirectedLinkKey } from "@/components/delegation/consolidation-builder/consolidation-plan";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  MEMES_CONTRACT,
  NEVER_DATE,
} from "@/constants/constants";

const A = `0x${"a".repeat(40)}`;
const B = `0x${"b".repeat(40)}`;
const C = `0x${"c".repeat(40)}`;
const D = `0x${"d".repeat(40)}`;

const success = (result: boolean) => ({ status: "success" as const, result });

describe("getLinkStatusReadParams", () => {
  it("reads both directions on Any Collection and The Memes", () => {
    const params = getLinkStatusReadParams([A, B]);

    expect(params).toHaveLength(4);
    expect(params.map((param) => param.args)).toEqual([
      [A, DELEGATION_ALL_ADDRESS, B, 999],
      [A, MEMES_CONTRACT, B, 999],
      [B, DELEGATION_ALL_ADDRESS, A, 999],
      [B, MEMES_CONTRACT, A, 999],
    ]);
    expect(params[0]).toMatchObject({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "retrieveGlobalStatusOfDelegation",
    });
  });

  it("reads nothing for an empty list", () => {
    expect(getLinkStatusReadParams([])).toEqual([]);
  });
});

describe("getRegisteredLinkKeys", () => {
  it("counts a direction registered on either collection", () => {
    const keys = getRegisteredLinkKeys(
      [A, B],
      [success(false), success(true), success(true), success(false)]
    );

    expect(keys).toEqual([toDirectedLinkKey(A, B), toDirectedLinkKey(B, A)]);
  });

  it("returns undefined until every read succeeds", () => {
    expect(getRegisteredLinkKeys([A, B], undefined)).toBeUndefined();
    expect(
      getRegisteredLinkKeys([A, B], [success(true), success(true)])
    ).toBeUndefined();
    expect(
      getRegisteredLinkKeys(
        [A, B],
        [success(true), { status: "failure" }, success(true), success(true)]
      )
    ).toBeUndefined();
  });
});

describe("getConsolidationStepWriteParams", () => {
  it("registers a single link directly", () => {
    expect(getConsolidationStepWriteParams([B])).toEqual({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "registerDelegationAddress",
      args: [DELEGATION_ALL_ADDRESS, B, NEVER_DATE, 999, true, 0],
    });
  });

  it("batches several links into one transaction with parallel arrays", () => {
    expect(getConsolidationStepWriteParams([B, C, D])).toEqual({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "batchDelegations",
      args: [
        [
          DELEGATION_ALL_ADDRESS,
          DELEGATION_ALL_ADDRESS,
          DELEGATION_ALL_ADDRESS,
        ],
        [B, C, D],
        [NEVER_DATE, NEVER_DATE, NEVER_DATE],
        [999, 999, 999],
        [true, true, true],
        [0, 0, 0],
      ],
    });
  });

  it("refuses an empty step or more links than one batch allows", () => {
    expect(() => getConsolidationStepWriteParams([])).toThrow();
    expect(() => getConsolidationStepWriteParams([A, B, C, D, A, B])).toThrow();
  });
});
