import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  MuseumInstitutionProfileSlug,
  MuseumInstitutionalPractice,
  MuseumPublication,
} from "@/lib/museum/publication/types";
import { MuseumMarkdown } from "./MuseumMarkdown";

const STUDY_ROUTE = "/museum/network/stories/a-field-of-practice";
const STUDY_PATH = "records/institutional-practice/a-field-of-practice.md";
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
] as const satisfies readonly MuseumInstitutionProfileSlug[];

const PROFILE_FOCUS_KEYS = {
  met: "museum.network.institutionalPractice.focus.met",
  getty: "museum.network.institutionalPractice.focus.getty",
  moma: "museum.network.institutionalPractice.focus.moma",
  whitney: "museum.network.institutionalPractice.focus.whitney",
  tate: "museum.network.institutionalPractice.focus.tate",
  "centre-pompidou":
    "museum.network.institutionalPractice.focus.centrePompidou",
  sfmoma: "museum.network.institutionalPractice.focus.sfmoma",
  guggenheim: "museum.network.institutionalPractice.focus.guggenheim",
  zkm: "museum.network.institutionalPractice.focus.zkm",
  "ars-electronica":
    "museum.network.institutionalPractice.focus.arsElectronica",
  "rhizome-new-museum":
    "museum.network.institutionalPractice.focus.rhizomeNewMuseum",
  "serpentine-arts-technologies":
    "museum.network.institutionalPractice.focus.serpentine",
  "v-and-a": "museum.network.institutionalPractice.focus.vAndA",
  lacma: "museum.network.institutionalPractice.focus.lacma",
} as const satisfies Record<MuseumInstitutionProfileSlug, MessageKey>;

const METADATA_LINE = /^-\s+\*\*([^*]+):\*\*\s+(.+)$/u;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

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
  const practice = (publication as Partial<MuseumPublication>)
    .institutionalPractice;
  if (practice === undefined) {
    return false;
  }
  if (
    practice.introduction.kind !== "institutional_practice_study" ||
    practice.introduction.sourcePath !== STUDY_PATH ||
    practice.sourceRegister.kind !== "institutional_practice_source_register" ||
    practice.sourceRegister.sourcePath !== SOURCE_REGISTER_PATH ||
    practice.profiles.length !== PROFILE_SLUGS.length
  ) {
    return false;
  }

  const admittedPaths = new Set(publication.declaredSourcePaths);
  const profileSlugs = new Set<MuseumInstitutionProfileSlug>();
  const packageDocuments = [
    practice.introduction,
    ...practice.profiles.map((profile) => profile.document),
    practice.sourceRegister,
  ];

  for (const [index, profile] of practice.profiles.entries()) {
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
  const lines = markdown.replace(/^\uFEFF/u, "").split(/\r?\n/u);
  const heading = /^#\s+(.+?)\s*$/u.exec(lines[0] ?? "");
  if (heading?.[1] === undefined) {
    return null;
  }

  let lineIndex = 1;
  while (lines[lineIndex]?.trim() === "") {
    lineIndex += 1;
  }

  const metadata = new Map<string, string>();
  while (lineIndex < lines.length) {
    const match = METADATA_LINE.exec(lines[lineIndex] ?? "");
    if (match?.[1] === undefined || match[2] === undefined) {
      break;
    }
    const label = match[1].trim();
    if (metadata.has(label)) {
      return null;
    }
    metadata.set(label, match[2].trim());
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
    !ISO_DATE.test(publicationDate) ||
    (researchCutoff === undefined) === (accessDate === undefined) ||
    (researchCutoff !== undefined && !ISO_DATE.test(researchCutoff)) ||
    (accessDate !== undefined && !ISO_DATE.test(accessDate)) ||
    body.length === 0
  ) {
    return null;
  }

  return {
    title: heading[1].trim(),
    subtitle: subtitle === undefined || subtitle.length === 0 ? null : subtitle,
    author,
    version,
    publicationDate,
    researchDate: researchCutoff ?? accessDate ?? "",
    researchDateKind: researchCutoff === undefined ? "accessed" : "cutoff",
    body,
  };
}

function formatPublicationDate(value: string): string {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
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

export function InstitutionalPracticeDirectory({
  practice,
}: {
  readonly practice: MuseumInstitutionalPractice;
}) {
  return (
    <ol className="tw-m-0 tw-mt-6 tw-list-none tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-0">
      {practice.profiles.map((profile, index) => (
        <li
          key={profile.id}
          className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
        >
          <Link
            href={`${STUDY_ROUTE}/${profile.slug}`}
            className="hover:tw-text-primary-200 tw-grid tw-min-h-20 tw-grid-cols-[2.25rem_minmax(0,1fr)] tw-gap-x-4 tw-gap-y-1 tw-py-5 tw-text-iron-100 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-grid-cols-[3rem_minmax(16rem,0.8fr)_minmax(18rem,1.2fr)] sm:tw-items-baseline sm:tw-gap-x-6"
          >
            <span className="tw-font-mono tw-text-xs tw-text-iron-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="tw-text-base tw-font-semibold tw-leading-6">
              {profile.document.title}
            </span>
            <span className="tw-col-start-2 tw-text-sm tw-leading-6 tw-text-iron-400 sm:tw-col-start-3">
              {t(DEFAULT_LOCALE, PROFILE_FOCUS_KEYS[profile.slug])}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
