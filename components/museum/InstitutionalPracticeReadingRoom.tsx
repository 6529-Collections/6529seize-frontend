import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumInstitutionProfileSlug,
  MuseumInstitutionalPractice,
  MuseumPublication,
} from "@/lib/museum/publication/types";
import { parseInstitutionalPracticeHeading } from "@/lib/museum/publication/institutionalPracticeMarkdown";
import { MuseumMarkdown } from "./MuseumMarkdown";

const STUDY_PATH = "records/institutional-practice/a-field-of-practice.md";
const ADJACENT_PRACTICE_PATH =
  "records/institutional-practice/adjacent-chain-native-practice.md";
const EDITORIAL_STANDARD_PATH = "docs/curatorial-publication-standard.md";
const SOURCE_REGISTER_PATH =
  "records/institutional-practice/source-register.md";

const PROFILE_SLUGS = [
  "met",
  "getty",
  "moma",
  "whitney",
  "tate",
  "centre-pompidou",
  "sfmoma",
  "guggenheim",
  "zkm",
  "ars-electronica",
  "rhizome-new-museum",
  "serpentine-arts-technologies",
  "v-and-a",
  "lacma",
  "hek-basel",
  "li-ma",
  "v2",
  "transmediale",
  "acmi",
  "m-plus",
  "nam-june-paik-art-center",
  "ntt-icc",
  "centro-multimedia",
  "laboratorio-arte-alameda",
  "dia",
  "walker-art-center",
  "mca-chicago",
] as const satisfies readonly MuseumInstitutionProfileSlug[];

const METADATA_PREFIX = "- **";
const METADATA_SEPARATOR = ":** ";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
const PUBLICATION_DATE_FORMAT = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
} satisfies Intl.DateTimeFormatOptions;

interface InstitutionalPracticeManuscriptProjection {
  readonly title: string;
  readonly subtitle: string | null;
  readonly author: string;
  readonly version: string;
  readonly publicationDate: string;
  readonly researchDate: string;
  readonly researchDateKind: "cutoff" | "accessed";
  readonly body: string;
}

function profileSourcePath(slug: MuseumInstitutionProfileSlug): string {
  return `records/institutional-practice/profiles/${slug}.md`;
}

function parseMetadataLine(line: string): readonly [string, string] | null {
  if (!line.startsWith(METADATA_PREFIX)) {
    return null;
  }
  const separatorIndex = line.indexOf(
    METADATA_SEPARATOR,
    METADATA_PREFIX.length
  );
  if (separatorIndex === -1) {
    return null;
  }
  const label = line.slice(METADATA_PREFIX.length, separatorIndex).trim();
  const value = line.slice(separatorIndex + METADATA_SEPARATOR.length).trim();
  if (label.length === 0 || label.includes("*") || value.length === 0) {
    return null;
  }
  return [label, value];
}

function documentIsPublishedInAggregate(
  publication: MuseumPublication,
  id: string,
  sourcePath: string
): boolean {
  return publication.documents.some(
    (document) => document.id === id && document.sourcePath === sourcePath
  );
}

export function institutionalPracticePublicationIsComplete(
  publication: MuseumPublication | null
): publication is MuseumPublication {
  if (publication === null) {
    return false;
  }
  const practice = (
    publication as unknown as {
      readonly institutionalPractice?: Partial<MuseumInstitutionalPractice>;
    }
  ).institutionalPractice;
  if (practice === undefined) {
    return false;
  }
  const {
    introduction,
    adjacentPractice,
    editorialStandard,
    sourceRegister,
    profiles,
  } = practice;
  if (
    introduction?.kind !== "institutional_practice_study" ||
    introduction.sourcePath !== STUDY_PATH ||
    adjacentPractice?.kind !== "institutional_practice_adjacent" ||
    adjacentPractice.sourcePath !== ADJACENT_PRACTICE_PATH ||
    editorialStandard?.kind !== "scholarship_editorial_standard" ||
    editorialStandard.sourcePath !== EDITORIAL_STANDARD_PATH ||
    sourceRegister?.kind !== "institutional_practice_source_register" ||
    sourceRegister.sourcePath !== SOURCE_REGISTER_PATH ||
    profiles?.length !== PROFILE_SLUGS.length
  ) {
    return false;
  }

  const admittedPaths = new Set(publication.declaredSourcePaths);
  const profileSlugs = new Set<MuseumInstitutionProfileSlug>();
  const packageDocuments = [
    introduction,
    ...profiles.map((profile) => profile.document),
    adjacentPractice,
    editorialStandard,
    sourceRegister,
  ];

  for (const [index, profile] of profiles.entries()) {
    const expectedSlug = PROFILE_SLUGS[index];
    if (
      expectedSlug === undefined ||
      profile.slug !== expectedSlug ||
      profile.id !== `institutional-practice:${expectedSlug}` ||
      profile.document.id !== profile.id ||
      profile.document.kind !== "institution_profile" ||
      profile.document.sourcePath !== profileSourcePath(expectedSlug) ||
      profile.document.title.trim().length === 0 ||
      profileSlugs.has(profile.slug)
    ) {
      return false;
    }
    profileSlugs.add(profile.slug);
  }

  return packageDocuments.every(
    (document) =>
      admittedPaths.has(document.sourcePath) &&
      documentIsPublishedInAggregate(
        publication,
        document.id,
        document.sourcePath
      )
  );
}

export function projectInstitutionalPracticeManuscript(
  markdown: string
): InstitutionalPracticeManuscriptProjection | null {
  const lines = markdown.split(/\r?\n/u);
  const title = parseInstitutionalPracticeHeading(markdown);
  if (title === null) {
    return null;
  }

  let lineIndex = 1;
  while (lines[lineIndex]?.trim() === "") {
    lineIndex += 1;
  }

  const metadata = new Map<string, string>();
  while (lineIndex < lines.length) {
    const metadataLine = parseMetadataLine(lines[lineIndex] ?? "");
    if (metadataLine === null) {
      break;
    }
    const [label, value] = metadataLine;
    if (metadata.has(label)) {
      return null;
    }
    metadata.set(label, value);
    lineIndex += 1;
  }

  while (lines[lineIndex]?.trim() === "") {
    lineIndex += 1;
  }

  const author = metadata.get("Institutional author");
  const version = metadata.get("Version");
  const publicationDate = metadata.get("Publication date");
  const researchCutoff = metadata.get("Research cutoff");
  const accessDate = metadata.get("Access date for all web sources");
  const subtitle = metadata.get("Subtitle")?.trim();
  const body = lines.slice(lineIndex).join("\n").trim();

  if (
    author === undefined ||
    author.length === 0 ||
    version === undefined ||
    version.length === 0 ||
    publicationDate === undefined ||
    !isCalendarDate(publicationDate) ||
    (researchCutoff === undefined) === (accessDate === undefined) ||
    (researchCutoff !== undefined && !isCalendarDate(researchCutoff)) ||
    (accessDate !== undefined && !isCalendarDate(accessDate)) ||
    body.length === 0
  ) {
    return null;
  }

  return {
    title,
    subtitle: subtitle === undefined || subtitle.length === 0 ? null : subtitle,
    author,
    version,
    publicationDate,
    researchDate: researchCutoff ?? accessDate ?? "",
    researchDateKind: researchCutoff === undefined ? "accessed" : "cutoff",
    body,
  };
}

function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function formatPublicationDate(value: string): string {
  return formatDate(
    DEFAULT_LOCALE,
    `${value}T00:00:00Z`,
    PUBLICATION_DATE_FORMAT
  );
}

export function InstitutionalPracticePublicationLine({
  projection,
}: {
  readonly projection: InstitutionalPracticeManuscriptProjection;
}) {
  return (
    <p className="tw-m-0 tw-mt-5 tw-flex tw-flex-col tw-gap-y-1 tw-text-xs tw-leading-5 tw-text-iron-500 sm:tw-flex-row sm:tw-flex-wrap sm:tw-gap-x-2">
      <span>{projection.author}</span>
      <span aria-hidden="true" className="tw-hidden sm:tw-inline">
        ·
      </span>
      <span>
        {t(DEFAULT_LOCALE, "museum.network.institutionalPractice.published", {
          date: formatPublicationDate(projection.publicationDate),
        })}
      </span>
      <span aria-hidden="true" className="tw-hidden sm:tw-inline">
        ·
      </span>
      <span>
        {t(
          DEFAULT_LOCALE,
          projection.researchDateKind === "cutoff"
            ? "museum.network.institutionalPractice.researchThrough"
            : "museum.network.institutionalPractice.sourcesAccessed",
          { date: formatPublicationDate(projection.researchDate) }
        )}
      </span>
      <span aria-hidden="true" className="tw-hidden sm:tw-inline">
        ·
      </span>
      <span>
        {t(DEFAULT_LOCALE, "museum.network.institutionalPractice.edition", {
          version: projection.version,
        })}
      </span>
    </p>
  );
}

export function InstitutionalPracticeManuscript({
  projection,
  sourceCommit,
  sourcePath,
}: {
  readonly projection: InstitutionalPracticeManuscriptProjection;
  readonly sourceCommit: string;
  readonly sourcePath: string;
}) {
  return (
    <MuseumMarkdown
      className="tw-mt-10"
      documentHeadings
      sourceCommit={sourceCommit}
      sourcePath={sourcePath}
    >
      {projection.body}
    </MuseumMarkdown>
  );
}
