import { projectMuseumResearchReading } from "@/lib/museum/researchEditorialProjection";

describe("projectMuseumResearchReading", () => {
  const markdown = [
    "# Complete study",
    "",
    "## First argument",
    "",
    "The first claim.",
    "",
    "### Evidence",
    "",
    "The evidence for it.",
    "",
    "## Appendix",
    "",
    "Machine-oriented detail.",
  ].join("\n");

  it("selects exact governed sections without exposing the complete appendix", () => {
    expect(
      projectMuseumResearchReading(markdown, ["First argument", "Evidence"])
    ).toBe(
      "## First argument\n\nThe first claim.\n\n### Evidence\n\nThe evidence for it."
    );
  });

  it("fails closed when a required editorial section is absent", () => {
    expect(
      projectMuseumResearchReading(markdown, ["First argument", "Missing"])
    ).toBeNull();
  });

  it("rejects heading prefixes instead of selecting a longer heading", () => {
    expect(projectMuseumResearchReading(markdown, ["First"])).toBeNull();
  });

  it("ignores heading-shaped text inside fenced code blocks", () => {
    const fenced = [
      "```markdown",
      "## Hidden example",
      "```",
      "",
      "## Visible section",
      "",
      "Public text.",
    ].join("\n");

    expect(projectMuseumResearchReading(fenced, ["Hidden example"])).toBeNull();
    expect(projectMuseumResearchReading(fenced, ["Visible section"])).toBe(
      "## Visible section\n\nPublic text."
    );
  });

  it("rejects duplicate source headings and duplicate requests", () => {
    expect(
      projectMuseumResearchReading(
        `${markdown}\n\n## First argument\n\nA duplicate.`,
        ["First argument"]
      )
    ).toBeNull();
    expect(
      projectMuseumResearchReading(markdown, [
        "First argument",
        "First argument",
      ])
    ).toBeNull();
  });

  it("removes inline references and their orphan definitions", () => {
    const footnoted = [
      "## Public argument",
      "",
      "A claim with a source.[^1]",
      "",
      "[^1]: The complete record retains this note.",
    ].join("\n");

    expect(projectMuseumResearchReading(footnoted, ["Public argument"])).toBe(
      ["## Public argument", "", "A claim with a source."].join("\n")
    );
  });

  it("preserves footnote markers and definitions inside fenced code", () => {
    const fenced = [
      "## Public argument",
      "",
      "```markdown",
      "A literal marker [^code]",
      "[^code]: A literal definition.",
      "```",
      "",
      "A claim with a source.[^1]",
      "",
      "[^1]: The complete record retains this note.",
    ].join("\n");

    expect(projectMuseumResearchReading(fenced, ["Public argument"])).toBe(
      [
        "## Public argument",
        "",
        "```markdown",
        "A literal marker [^code]",
        "[^code]: A literal definition.",
        "```",
        "",
        "A claim with a source.",
      ].join("\n")
    );
  });

  it("keeps language-tagged fence examples and inline code literal", () => {
    const fenced = [
      "## Public argument",
      "",
      "```markdown",
      "```tsx",
      "const marker = '[^code]';",
      "```",
      "",
      "Use `[^literal]` as literal text and remove [^source]: here.",
      "",
      "[^source]: The complete record retains this note.",
    ].join("\n");

    expect(projectMuseumResearchReading(fenced, ["Public argument"])).toBe(
      [
        "## Public argument",
        "",
        "```markdown",
        "```tsx",
        "const marker = '[^code]';",
        "```",
        "",
        "Use `[^literal]` as literal text and remove : here.",
      ].join("\n")
    );
  });

  it("does not expose a heading after a language-tagged fence example", () => {
    const fenced = [
      "```markdown",
      "```tsx",
      "## Still fenced",
      "```",
      "",
      "## Visible section",
      "",
      "Public text.",
    ].join("\n");

    expect(projectMuseumResearchReading(fenced, ["Still fenced"])).toBeNull();
    expect(projectMuseumResearchReading(fenced, ["Visible section"])).toBe(
      "## Visible section\n\nPublic text."
    );
  });
});
