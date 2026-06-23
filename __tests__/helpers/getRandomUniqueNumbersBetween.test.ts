import { getRandomUniqueNumbersBetween } from "@/helpers/Helpers";

describe("getRandomUniqueNumbersBetween", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockRandomIntegers = (values: readonly number[]) => {
    let callIndex = 0;
    jest.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
      const typedArray = array as Uint32Array;
      const nextValue = values[callIndex++];
      if (nextValue === undefined) {
        throw new Error("getRandomValues called unexpectedly");
      }
      typedArray[0] = nextValue;
      return array;
    });
  };

  it("throws when the bounds are invalid", () => {
    expect(() => getRandomUniqueNumbersBetween(5, 5)).toThrow(
      "maxExclusive must be greater than minInclusive."
    );
    expect(() => getRandomUniqueNumbersBetween(1.2, 4)).toThrow(
      "Both minInclusive and maxExclusive must be integers."
    );
  });

  it("returns deterministic unique strings within range when crypto is mocked", () => {
    mockRandomIntegers([1, 0, 1]);

    const result = getRandomUniqueNumbersBetween(3, 5);

    expect(result).toEqual(["3", "4"]);
  });

  it("always returns at least one value", () => {
    mockRandomIntegers([0, 0]);

    const result = getRandomUniqueNumbersBetween(10, 13);
    expect(result.length).toBe(1);
    expect(result[0]).toBe("10");
  });
});
