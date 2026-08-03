import {
  MUSEUM_OPEN_STATEMENT_PATH,
  withoutEmbeddedStatementFrontMatter,
} from "@/lib/museum/publication/openMuseum";
import type { MuseumPublicDocument } from "@/lib/museum/publication/types";

function openMuseumDocument(markdown: string): MuseumPublicDocument {
  return {
    id: "open-museum",
    kind: "open_museum_statement",
    title: "The record outlives the interface",
    markdown,
    sha256: null,
    sourcePath: MUSEUM_OPEN_STATEMENT_PATH,
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
  };
}

describe("withoutEmbeddedStatementFrontMatter", () => {
  it("suppresses only the exact title and status already rendered by the visitor framing", () => {
    const markdown = [
      "# The record outlives the interface",
      "",
      "Status: working public operating statement; not an adopted governance policy",
      "",
      "## An open museum, built in public",
      "",
      "The governed body remains exact.",
    ].join("\n");

    expect(
      withoutEmbeddedStatementFrontMatter(openMuseumDocument(markdown))
    ).toBe(
      "## An open museum, built in public\n\nThe governed body remains exact."
    );
  });

  it("fails closed when a substantive caveat extends the status paragraph", () => {
    const markdown = [
      "# The record outlives the interface",
      "",
      "Status: working public operating statement; not an adopted governance policy",
      "Additional governed caveat that must remain visible.",
      "",
      "## An open museum, built in public",
    ].join("\n");

    expect(
      withoutEmbeddedStatementFrontMatter(openMuseumDocument(markdown))
    ).toBe(markdown);
  });

  it("fails closed when the governed title drifts", () => {
    const markdown = [
      "# A revised governed title",
      "",
      "Status: working public operating statement; not an adopted governance policy",
      "",
      "## An open museum, built in public",
    ].join("\n");

    expect(
      withoutEmbeddedStatementFrontMatter(openMuseumDocument(markdown))
    ).toBe(markdown);
  });
});
