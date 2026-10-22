import {
  getPendingSearchFilter,
  isAdvancedSearchEnabledForUser,
  unescapeSearchOperators,
} from "@/helpers/advanced-search.helpers";

describe("advanced search availability", () => {
  it.each([undefined, "", "   "])(
    "enables everyone when the setting is absent or empty: %s",
    (value) => {
      expect(isAdvancedSearchEnabledForUser(value, null)).toBe(true);
      expect(isAdvancedSearchEnabledForUser(value, "alice")).toBe(true);
    }
  );
  it("matches whole handles case-insensitively and trims entries", () => {
    expect(
      isAdvancedSearchEnabledForUser(" GelatoGenesis, prxt0 ", "gelatogenesis")
    ).toBe(true);
    expect(
      isAdvancedSearchEnabledForUser(" GelatoGenesis, prxt0 ", "prxt0")
    ).toBe(true);
    expect(
      isAdvancedSearchEnabledForUser("GelatoGenesis,prxt0", "Gelato")
    ).toBe(false);
    expect(isAdvancedSearchEnabledForUser("GelatoGenesis,prxt0", null)).toBe(
      false
    );
    expect(isAdvancedSearchEnabledForUser(", ,", "alice")).toBe(false);
  });
});

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
