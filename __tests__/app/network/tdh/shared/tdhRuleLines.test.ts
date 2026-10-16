import { ruleLines, ruleTokens } from "@/app/network/tdh/shared/tdhRuleLines";

describe("ruleLines", () => {
  it("splits a trailing comment from its code and marks a vector reference", () => {
    expect(ruleLines("invalid if two logs share one   # vector 52")).toEqual([
      {
        kind: "code",
        indent: 0,
        code: "invalid if two logs share one",
        comment: "# vector 52",
        reference: true,
      },
    ]);
  });

  it("folds a comment written alone under its line into that line", () => {
    const lines = ruleLines(
      [
        "decoded inputs: items",
        "    kept or not",
        "                # vectors 30, 51",
      ].join("\n")
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatchObject({
      indent: 4,
      code: "kept or not",
      comment: "# vectors 30, 51",
      reference: true,
    });
  });

  it("joins the rest of a field's comment to the comment above it", () => {
    const lines = ruleLines(
      [
        '  bytes32 tdhRuleId,        # H("6529.TdhRule.v1",',
        "                            #   registryHash), P28 §4.5",
      ].join("\n")
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]?.comment).toBe(
      '# H("6529.TdhRule.v1", registryHash), P28 §4.5'
    );
    expect(lines[0]?.reference).toBe(false);
  });

  it("keeps a comment in the first column as a heading line", () => {
    const lines = ruleLines(
      ["# The cycle date (§4.1)", "a date is eight digits"].join("\n")
    );
    expect(lines.map((line) => line.kind)).toEqual(["comment", "code"]);
  });

  it("reads Lean's comment marker", () => {
    expect(
      ruleLines("theorem t : True  -- trivially", "lean")[0]
    ).toMatchObject({
      code: "theorem t : True",
      comment: "-- trivially",
    });
  });
});

describe("ruleTokens", () => {
  it("tints numbers, strings, rule names and a statement keyword", () => {
    const tokens = ruleTokens('if s = 1 and RATE(H, "x") > 0x1f', "pseudo");
    expect(tokens.filter((token) => token.kind !== "text")).toEqual([
      { kind: "keyword", text: "if" },
      { kind: "number", text: "1" },
      { kind: "name", text: "RATE" },
      { kind: "name", text: "H" },
      { kind: "string", text: '"x"' },
      { kind: "number", text: "0x1f" },
    ]);
    expect(tokens.map((token) => token.text).join("")).toBe(
      'if s = 1 and RATE(H, "x") > 0x1f'
    );
  });

  it("tints only real keywords: statements that start a line, actions after a colon", () => {
    const keywords = (text: string) =>
      ruleTokens(text, "pseudo")
        .filter((token) => token.kind === "keyword")
        .map((token) => token.text);
    expect(keywords("if from = to or amount = 0: skip")).toEqual([
      "if",
      "skip",
    ]);
    expect(keywords("repeat while |C| < 3")).toEqual(["repeat", "while"]);
    expect(keywords("for each (c1, c2) in Q, in order:")).toEqual(["for"]);
    // English words inside a line of pseudocode stay plain.
    expect(keywords("headers read for the cycle, or later, or none")).toEqual(
      []
    );
    expect(keywords("    append moved to stack[to]")).toEqual(["append"]);
  });

  it("keeps names with digits whole and plain: §3.2, tdh-v1.0, DEV-10", () => {
    const text =
      'v = "x" # tdh-v1.0 (§3.2, §6.1), DEV-10, BUG-15 and ERC-1155: 2^64';
    const tokens = ruleTokens(text, "pseudo");
    expect(
      tokens
        .filter((token) => token.kind === "number")
        .map((token) => token.text)
    ).toEqual(["2", "64"]);
    expect(tokens.map((token) => token.text).join("")).toBe(text);
    // A number of its own still tints, decimals included.
    expect(
      ruleTokens("q = 0.6529, n >= 33", "pseudo")
        .filter((token) => token.kind === "number")
        .map((token) => token.text)
    ).toEqual(["0.6529", "33"]);
  });

  it("tints Lean keywords wherever they are", () => {
    expect(
      ruleTokens("theorem t : True := by trivial", "lean")
        .filter((token) => token.kind === "keyword")
        .map((token) => token.text)
    ).toEqual(["theorem", "by"]);
  });
});
