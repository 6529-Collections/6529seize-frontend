import {
  ANY_COLLECTION,
  CONSOLIDATION_USE_CASE,
  DELEGATION_USE_CASES,
  GRADIENTS_COLLECTION,
  MEMES_COLLECTION,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
  SUPPORTED_COLLECTIONS,
} from "@/components/delegation/delegation-constants";
import {
  findDelegationCollectionOption,
  findDelegationUseCaseOption,
  getDelegationCollectionOptions,
  parseDelegationFormPresets,
} from "@/components/delegation/delegation-options";
import { MEMES_CONTRACT } from "@/constants/constants";

function useCasePreset(use_case: string | string[] | undefined) {
  return parseDelegationFormPresets({ use_case }).useCaseQuery;
}

function collectionPreset(collection: string | string[] | undefined) {
  return parseDelegationFormPresets({ collection }).collectionQuery;
}

describe("delegation link presets", () => {
  it.each(DELEGATION_USE_CASES.map((useCase) => useCase.use_case))(
    "accepts listed use case %i",
    (useCase) => {
      expect(useCasePreset(String(useCase))).toBe(useCase);
    }
  );

  it.each([
    String(PRIMARY_ADDRESS_USE_CASE.use_case),
    String(SUB_DELEGATION_USE_CASE.use_case),
    String(CONSOLIDATION_USE_CASE.use_case),
    "18",
    "0",
    "-1",
    "-3",
    "02",
    " 2",
    "2 ",
    "2abc",
    "1.0",
    "1e0",
    "0x2",
    "abc",
    "",
    undefined,
    ["2"],
    ["2", "3"],
  ])("ignores use case preset %j", (value) => {
    expect(useCasePreset(value)).toBe(0);
  });

  it.each(SUPPORTED_COLLECTIONS.map((collection) => collection.contract))(
    "accepts listed collection %s in any letter case",
    (contract) => {
      expect(collectionPreset(contract)).toBe(contract);
      expect(collectionPreset(contract.toLowerCase())).toBe(contract);
      expect(collectionPreset(contract.toUpperCase())).toBe(contract);
    }
  );

  it.each(["MEMES", "memes", "Memes"])(
    "maps the %s alias to The Memes contract",
    (alias) => {
      expect(collectionPreset(alias)).toBe(MEMES_CONTRACT);
    }
  );

  it.each([
    "0x1111111111111111111111111111111111111111",
    "0x33FD426905F149f8376e227d0C9D3340AaD17aF",
    "0",
    "collection",
    "MEME_LAB",
    "GRADIENTS",
    " MEMES",
    "",
    undefined,
    [MEMES_CONTRACT],
    ["MEMES", "MEMES"],
  ])("ignores collection preset %j", (value) => {
    expect(collectionPreset(value)).toBe("");
  });

  it("parses both presets together", () => {
    expect(
      parseDelegationFormPresets({ collection: "MEMES", use_case: "3" })
    ).toEqual({ collectionQuery: MEMES_CONTRACT, useCaseQuery: 3 });
    expect(
      parseDelegationFormPresets({
        collection: ANY_COLLECTION.contract,
        use_case: String(CONSOLIDATION_USE_CASE.use_case),
      })
    ).toEqual({ collectionQuery: ANY_COLLECTION.contract, useCaseQuery: 0 });
    expect(parseDelegationFormPresets({})).toEqual({
      collectionQuery: "",
      useCaseQuery: 0,
    });
  });
});

describe("delegation form options", () => {
  it("lists every supported collection without a delegation manager", () => {
    expect(getDelegationCollectionOptions()).toBe(SUPPORTED_COLLECTIONS);
    expect(getDelegationCollectionOptions({ collection: ANY_COLLECTION })).toBe(
      SUPPORTED_COLLECTIONS
    );
  });

  it("limits a collection-scoped delegation manager to its collection", () => {
    expect(
      getDelegationCollectionOptions({ collection: GRADIENTS_COLLECTION })
    ).toEqual([GRADIENTS_COLLECTION]);
  });

  it("finds only listed options", () => {
    expect(findDelegationCollectionOption(MEMES_CONTRACT.toLowerCase())).toBe(
      MEMES_COLLECTION
    );
    expect(
      findDelegationCollectionOption(MEMES_CONTRACT, [GRADIENTS_COLLECTION])
    ).toBeUndefined();
    expect(findDelegationCollectionOption("0")).toBeUndefined();
    expect(findDelegationCollectionOption(undefined)).toBeUndefined();

    expect(findDelegationUseCaseOption(2)?.use_case).toBe(2);
    for (const useCase of [0, -1, 18, 997, 998, 999, Number.NaN, undefined]) {
      expect(findDelegationUseCaseOption(useCase)).toBeUndefined();
    }
  });
});
