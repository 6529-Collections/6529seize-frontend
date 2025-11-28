import { getRandomUniqueNumbersBetween } from "@/helpers/Helpers";

describe("getRandomUniqueNumbersBetween", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws when the bounds are invalid", () => {
    expect(() => getRandomUniqueNumbersBetween(5, 5)).toThrow(
      "maxExclusive must be greater than minInclusive."
    );
    expect(() => getRandomUniqueNumbersBetween(1.2, 4)).toThrow(
      "Both minInclusive and maxExclusive must be integers."
    );
  });

  it("returns deterministic unique strings within range when Math.random is mocked", () => {
    const randomSequence = [0.9, 0.1, 0.7];
    let callIndex = 0;
    jest.spyOn(Math, "random").mockImplementation(() => {
      if (callIndex >= randomSequence.length) {
        throw new Error("Math.random called unexpectedly");
      }
      return randomSequence[callIndex++];
    });

    const result = getRandomUniqueNumbersBetween(3, 5);

    expect(result).toEqual(["3", "4"]);
  });

  it("always returns at least one value", () => {
    const randomSequence = [0, 0.2];
    let callIndex = 0;
    jest.spyOn(Math, "random").mockImplementation(() => {
      if (callIndex >= randomSequence.length) {
        throw new Error("Math.random called unexpectedly");
      }
      return randomSequence[callIndex++];
    });

    const result = getRandomUniqueNumbersBetween(10, 13);
    expect(result.length).toBe(1);
    expect(result[0]).toBe("10");
  });
});
