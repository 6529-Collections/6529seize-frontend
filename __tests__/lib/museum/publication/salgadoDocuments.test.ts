import { salgadoDocumentMarkdown } from "@/lib/museum/publication/salgadoDocuments";

const ROOT = "records/accessions/6529NM.2026.004/public";
const WORK_SOURCE = `# Forest, Jaú River

**Artist:** Sebastião Salgado
**Date:** 2019
**Text:** Museum edition metadata

## Label

Pale palm trunks stand out against deep shade.[^1]

**Related:** [Amazônia](/museum/network/projects/amazonia)

## Sources and record notes

[^1]: [Issuer metadata](https://example.test/226).
    A descriptive title follows the recorded location.

## Publication record

**Author:** Museum; constructed with Codex.
**Supersedes:** Earlier edition.
`;

describe("Salgado catalogue prose presentation", () => {
  it.each([1, 2, 3, 4, 5, 6])(
    "keeps the label, links and source notes for work %i",
    (item) => {
      const path = `${ROOT}/6529NM.2026.004.0${item}.md`;
      const body = salgadoDocumentMarkdown(path, WORK_SOURCE);
      expect(body).toContain(
        "Pale palm trunks stand out against deep shade.[^1]"
      );
      expect(body).toContain("[Amazônia](/museum/network/projects/amazonia)");
      expect(body).toContain(
        "[^1]: [Issuer metadata](https://example.test/226)."
      );
      expect(body).toContain(
        "A descriptive title follows the recorded location."
      );
      expect(body).not.toMatch(
        /\*\*Artist:|\*\*Date:|\*\*Text:|## Label|## Sources and record notes|Publication record|Codex|Supersedes/u
      );
    }
  );

  it.each([
    ["acquisition-narrative.md", "Acquisition narrative"],
    ["sebastiao-salgado.md", "Artist study"],
    ["amazonia-project.md", "Project study"],
  ])(
    "keeps context and notes without publication controls in %s",
    (name, kind) => {
      const source = `# Catalogue title\n\n**${kind}** · Museum · Version 1.1.1\n\nSourced catalogue prose.[^1]\n\n## Context\n\nProject context.\n\n[^1]: Primary source.\n\n## Publication record\n\nConstructed with Codex.\n`;
      const body = salgadoDocumentMarkdown(`${ROOT}/${name}`, source);
      expect(body).toBe(
        "Sourced catalogue prose.[^1]\n\n## Context\n\nProject context.\n\n[^1]: Primary source."
      );
    }
  );

  it("preserves administrative and other accession sources verbatim", () => {
    for (const path of [
      `${ROOT}/title-rights-and-display.md`,
      `${ROOT}/6529NM.2026.004.07.md`,
      "records/accessions/6529NM.2026.002/public/6529NM.2026.002.01.md",
    ]) {
      expect(salgadoDocumentMarkdown(path, WORK_SOURCE)).toBe(WORK_SOURCE);
    }
  });

  it("keeps an unrecognized work manuscript intact", () => {
    const source =
      "# Changed structure\n\nCatalogue prose without a Label heading.";
    expect(
      salgadoDocumentMarkdown(`${ROOT}/6529NM.2026.004.01.md`, source)
    ).toBe(source);
  });
});
