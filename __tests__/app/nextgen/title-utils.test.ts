import { getNextgenTitle } from "@/app/nextgen/title-utils";

describe("getNextgenTitle", () => {
  it("uses NextGen when no title parts are available", () => {
    expect(getNextgenTitle()).toBe("NextGen");
  });

  it("orders specific page titles before their parent", () => {
    expect(getNextgenTitle("Mint", "Pebbles")).toBe("Mint | Pebbles");
  });

  it("ignores empty title parts", () => {
    expect(getNextgenTitle("", undefined, "Pebbles", null)).toBe("Pebbles");
  });
});
