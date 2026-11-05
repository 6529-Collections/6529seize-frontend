import type {
  MuseumPublicDocumentKind,
  MuseumPublicEntityRecord,
} from "./types";

const ACCESSION_ROOT = "records/accessions/6529NM.2026.004";
const PUBLIC_ROOT = `${ACCESSION_ROOT}/public`;

const ACQUISITION_DOCUMENTS = [
  [`${PUBLIC_ROOT}/acquisition-narrative.md`, "gift_narrative"],
  [`${PUBLIC_ROOT}/accession.md`, "curatorial_accession_review"],
  [
    `${PUBLIC_ROOT}/title-rights-and-display.md`,
    "title_rights_accession_review",
  ],
  [
    `${PUBLIC_ROOT}/technical-and-condition-review.md`,
    "technical_condition_review",
  ],
  [`${PUBLIC_ROOT}/display-and-preservation.md`, "technical_condition_review"],
  [
    `${PUBLIC_ROOT}/registration-diligence.md`,
    "custody_title_compliance_diligence",
  ],
  [
    `${PUBLIC_ROOT}/web-presentation-authority.md`,
    "title_rights_accession_review",
  ],
  [`${PUBLIC_ROOT}/source-and-chronology.md`, "source_chronology_matrix"],
] as const satisfies readonly (readonly [string, MuseumPublicDocumentKind])[];

const CONTEXT_DOCUMENTS = [
  [`${PUBLIC_ROOT}/sebastiao-salgado.md`, "artist_practice"],
  [`${PUBLIC_ROOT}/amazonia-project.md`, "project_essay"],
] as const satisfies readonly (readonly [string, MuseumPublicDocumentKind])[];

const DOCUMENT_KINDS = new Map<string, MuseumPublicDocumentKind>([
  ...ACQUISITION_DOCUMENTS,
  ...CONTEXT_DOCUMENTS,
]);

export function salgadoDocumentKind(
  path: string
): MuseumPublicDocumentKind | undefined {
  return DOCUMENT_KINDS.get(path);
}

/** Keep catalogue prose beside structured metadata; retain the full source file. */
export function salgadoDocumentMarkdown(
  path: string,
  markdown: string
): string {
  const isWork =
    /^records\/accessions\/6529NM\.2026\.004\/public\/6529NM\.2026\.004\.0[1-6]\.md$/u.test(
      path
    );
  const isContext = [
    `${PUBLIC_ROOT}/acquisition-narrative.md`,
    ...CONTEXT_DOCUMENTS.map(([documentPath]) => documentPath),
  ].includes(path);
  if (!isWork && !isContext) return markdown;

  const normalized = markdown.replace(/\r\n?/gu, "\n");
  const publication = /^## Publication record[ \t]*$/mu.exec(normalized);
  const prose =
    publication === null ? normalized : normalized.slice(0, publication.index);
  return isWork
    ? salgadoWorkMarkdown(prose, markdown)
    : salgadoContextMarkdown(prose);
}

function salgadoWorkMarkdown(prose: string, source: string): string {
  const label = /^## Label[ \t]*\n/mu.exec(prose);
  if (label === null) return source;
  const lines = prose.slice(label.index + label[0].length).split("\n");
  const notes = lines.findIndex(
    (line) => line.trimEnd() === "## Sources and record notes"
  );
  if (notes !== -1) {
    let end = notes + 1;
    while (end < lines.length && lines[end]?.trim() === "") end += 1;
    lines.splice(notes, end - notes);
  }
  return lines.join("\n").trim();
}

function salgadoContextMarkdown(prose: string): string {
  const lines = prose.split("\n");
  if (lines[0]?.startsWith("# ")) {
    lines.shift();
    while (lines[0] === "") lines.shift();
    const mastheads = [
      "**Acquisition narrative**",
      "**Artist study**",
      "**Project study**",
    ];
    if (mastheads.some((masthead) => lines[0]?.startsWith(masthead))) {
      lines.shift();
      while (lines[0] === "") lines.shift();
    }
  }
  return lines.join("\n").trim();
}

/** The acquisition, artist, project, and object entries have separate jobs. */
export function salgadoDocumentPaths(
  entity: MuseumPublicEntityRecord
): readonly string[] | undefined {
  if (entity.id === "6529NM-CA-2026-005") {
    return ACQUISITION_DOCUMENTS.map(([path]) => path);
  }
  if (entity.id === "6529NM-ART-0024") {
    return [`${PUBLIC_ROOT}/sebastiao-salgado.md`];
  }
  if (entity.id === "6529NM-PRJ-0008") {
    return [`${PUBLIC_ROOT}/amazonia-project.md`];
  }
  const index = [
    "6529NM-W-0030",
    "6529NM-W-0031",
    "6529NM-W-0032",
    "6529NM-W-0033",
    "6529NM-W-0034",
    "6529NM-W-0035",
  ].indexOf(entity.id);
  return index === -1
    ? undefined
    : [
        `${PUBLIC_ROOT}/6529NM.2026.004.${String(index + 1).padStart(2, "0")}.md`,
      ];
}
