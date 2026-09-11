import { projectSourceMatrixForVisitors } from "@/lib/museum/publication/sourceMatrixProjection";

const source = [
  "# Internal source matrix",
  "",
  "- **Status:** internal metadata",
  "",
  "## 1. How all writing lanes should use this file",
  "",
  "Internal instruction.",
  "",
  "## 2. Canonical accession facts",
  "",
  "| Fact | Source |",
  "| --- | --- |",
  "| Seven works | Record |",
  "",
  "## 11. Required omissions to acknowledge in the monograph and collection essay",
  "",
  "Known limits.",
  "",
  "## 12. Notes style shared across lanes",
  "",
  "Internal style instruction.",
  "",
  "## Revision history",
].join("\n");

describe("projectSourceMatrixForVisitors", () => {
  it("returns the exact public research span", () => {
    expect(projectSourceMatrixForVisitors(source)).toBe(
      [
        "## 2. Canonical accession facts",
        "",
        "| Fact | Source |",
        "| --- | --- |",
        "| Seven works | Record |",
        "",
        "## 11. Required omissions to acknowledge in the monograph and collection essay",
        "",
        "Known limits.",
        "",
        "",
      ].join("\n")
    );
  });

  it.each([
    source.replace("## 2. Canonical accession facts", "## Canonical facts"),
    source.replace("## 12. Notes style shared across lanes", "## Notes style"),
    `${source}\n## 2. Canonical accession facts`,
  ])("fails closed when the exact boundaries are not unique", (markdown) => {
    expect(projectSourceMatrixForVisitors(markdown)).toBeNull();
  });

  it("ignores exact boundary text inside fenced code blocks", () => {
    const fencedBoundaries = [
      "```markdown",
      "## 2. Canonical accession facts",
      "Not public research.",
      "## 12. Notes style shared across lanes",
      "```",
    ].join("\n");

    expect(projectSourceMatrixForVisitors(fencedBoundaries)).toBeNull();
    expect(
      projectSourceMatrixForVisitors(`${fencedBoundaries}\n${source}`)
    ).toBe(projectSourceMatrixForVisitors(source));
  });
});
