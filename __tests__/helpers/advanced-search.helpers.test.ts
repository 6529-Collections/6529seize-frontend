import {
  getPendingSearchFilter,
  unescapeSearchOperators,
} from "@/helpers/advanced-search.helpers";

describe("search filter input", () => {
  it("keeps the text outside a pending filter and handles wave names with spaces", () => {
    expect(getPendingSearchFilter("hello in: #Main Stage")).toEqual({
      kind: "in",
      value: "Main Stage",
      text: "hello",
    });
    expect(getPendingSearchFilter("FROM: @alice")).toEqual({
      kind: "from",
      value: "alice",
      text: "",
    });
  });
  it("only recognizes from: and in: at word boundaries", () => {
    expect(getPendingSearchFilter("within: test")).toBeNull();
    expect(getPendingSearchFilter("after: yesterday")).toBeNull();
    expect(getPendingSearchFilter("ordinary words")).toBeNull();
  });
});

describe("literal search operators", () => {
  it("keeps escaped operators as searchable text", () => {
    const query = String.raw`info \in: progress \from: yesterday`;
    expect(getPendingSearchFilter(query)).toBeNull();
    expect(unescapeSearchOperators(query)).toBe(
      "info in: progress from: yesterday"
    );
    expect(unescapeSearchOperators("within: progress")).toBe(
      "within: progress"
    );
  });
});
