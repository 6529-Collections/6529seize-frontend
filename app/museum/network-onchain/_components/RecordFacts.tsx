import Link from "next/link";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type { OnchainMuseumRecord } from "@/lib/museum/onchain/museum";
import { isPlainObject, languageText } from "@/lib/museum/onchain/profile";
import {
  asRecord,
  bodyOf,
  bodyText,
  familyOf,
  identifiersOf,
  onchainMuseumRecordHref,
} from "@/lib/museum/onchain/fields";
import type {
  OnchainLink,
  OnchainMuseumView,
} from "@/lib/museum/onchain/presentation";
import {
  collectionOf,
  creatorsOf,
  creditLineOf,
  mediumOf,
  memberships,
  objectRecordsOf,
  workForEntity,
} from "@/lib/museum/onchain/works";
import { registryValueLabel } from "./labels";
import {
  formatCount,
  formatUtcDateTime,
  LIST_LINK,
  Mono,
  TEXT_LINK,
} from "./OnchainParts";

const locale = DEFAULT_LOCALE;

type Fact = { label: string; value: ReactNode };

export function EntityLink({ link }: Readonly<{ link: OnchainLink }>) {
  return link.href === null ? (
    <span>
      <Mono>{link.id}</Mono>{" "}
      <span className="tw-text-xs tw-text-iron-400">
        {t(locale, "museum.onchain.record.notInRegistry")}
      </span>
    </span>
  ) : (
    <Link href={link.href} className={LIST_LINK}>
      {link.label}
    </Link>
  );
}

export function RecordLinks({
  view,
  records,
}: Readonly<{
  view: OnchainMuseumView;
  records: readonly OnchainMuseumRecord[];
}>) {
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
      {records.map((record) => (
        <li key={record.subjectId}>
          <Link
            href={onchainMuseumRecordHref(record.subjectId)}
            className={LIST_LINK}
          >
            {view.labelOf(record)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function linksFact(
  view: OnchainMuseumView,
  key: MessageKey,
  records: readonly OnchainMuseumRecord[]
): Fact[] {
  return records.length === 0
    ? []
    : [
        {
          label: t(locale, key),
          value: <RecordLinks view={view} records={records} />,
        },
      ];
}

function textFact(key: MessageKey, value: string | null): Fact[] {
  return value === null ? [] : [{ label: t(locale, key), value }];
}

/** Words that mark a clause as a caveat about the record, not a medium. */
const CAVEAT =
  /unverified|not (?:yet )?(?:been )?(?:independently )?verified|not established/iu;

/**
 * The medium as the Museum records it. When the clauses after the first
 * semicolon are a caveat about the record, they are shown on their own line
 * with their words unchanged; a list of media stays whole.
 */
function mediumFacts(medium: string | null): Fact[] {
  const [lead = "", ...rest] = (medium ?? "").split(/;\s*/u);
  const note = rest.join("; ");
  if (note === "" || !CAVEAT.test(note)) {
    return recordedFact("museum.onchain.record.medium", medium);
  }
  return [
    ...recordedFact("museum.onchain.record.medium", lead === "" ? null : lead),
    ...(note === ""
      ? []
      : [
          { label: t(locale, "museum.onchain.record.mediumNote"), value: note },
        ]),
  ];
}

/** A caption field every work shows, saying so when the record has none. */
function recordedFact(key: MessageKey, value: string | null): Fact[] {
  return [
    {
      label: t(locale, key),
      value: value ?? (
        <span className="tw-text-iron-400">
          {t(locale, "museum.onchain.record.notRecorded")}
        </span>
      ),
    },
  ];
}

/** A reference shown as a link to its record, or as the URI it names. */
function RefValue({
  view,
  value,
}: Readonly<{ view: OnchainMuseumView; value: unknown }>) {
  const record = view.recordForRef(value);
  if (record !== null) return <RecordLinks view={view} records={[record]} />;
  if (typeof value === "string" && value.startsWith("https://")) {
    return (
      <a href={value} rel="noreferrer" className={TEXT_LINK}>
        {t(locale, "museum.onchain.record.pageOn", {
          host: new URL(value).hostname,
        })}
      </a>
    );
  }
  return <EntityLink link={view.resolveRef(value)} />;
}

function refsFact(
  view: OnchainMuseumView,
  key: MessageKey,
  refs: readonly unknown[]
): Fact[] {
  return refs.length === 0
    ? []
    : [
        {
          label: t(locale, key),
          value: (
            <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
              {refs.map((ref, index) => (
                // A reference has no identity beyond its place in the record.
                <li key={index}>
                  <RefValue view={view} value={ref} />
                </li>
              ))}
            </ul>
          ),
        },
      ];
}

/** Agents of a `created_by` or `decided_by` list. */
function agentRefs(value: unknown): unknown[] {
  return (Array.isArray(value) ? value : [])
    .map((item) => asRecord(item)?.["agent"])
    .filter((item) => item !== undefined);
}

function identifierFacts(record: OnchainMuseumRecord): Fact[] {
  return [
    ...textFact(
      "museum.onchain.record.token",
      identifiersOf(record, "caip19")[0] ?? null
    ),
    ...textFact(
      "museum.onchain.record.accessionNumber",
      identifiersOf(record, "accession_number")[0] ?? null
    ),
  ];
}

function workFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const collection = collectionOf(view, record);
  const acquisitions = memberships(view, record, "acquisition");
  const acquisitionLabels = new Set(
    acquisitions.map((item) => view.labelOf(item))
  );
  // A program named like the acquisition it produced is listed once.
  const programs = memberships(view, record, "program").filter(
    (item) => !acquisitionLabels.has(view.labelOf(item))
  );
  return [
    ...linksFact(
      view,
      "museum.onchain.record.creators",
      creatorsOf(view, record)
    ),
    {
      label: t(locale, "museum.onchain.record.date"),
      value: bodyText(record, "date") ?? (
        <span className="tw-text-iron-400">
          {t(locale, "museum.onchain.record.dateNotEstablished")}
        </span>
      ),
    },
    ...mediumFacts(mediumOf(record)),
    ...recordedFact(
      "museum.onchain.record.creditLine",
      creditLineOf(view, record)
    ),
    {
      label: t(locale, "museum.onchain.record.collection"),
      value:
        collection === null ? (
          t(locale, "museum.onchain.record.notInCollection")
        ) : (
          <RecordLinks view={view} records={[collection]} />
        ),
    },
    ...linksFact(
      view,
      "museum.onchain.record.accession",
      memberships(view, record, "accession")
    ),
    ...linksFact(view, "museum.onchain.record.acquisition", acquisitions),
    ...linksFact(view, "museum.onchain.record.program", programs),
    ...linksFact(
      view,
      "museum.onchain.record.project",
      memberships(view, record, "project")
    ),
    ...identifierFacts(record),
    ...linksFact(
      view,
      "museum.onchain.record.objectRecords",
      objectRecordsOf(view, record)
    ),
  ];
}

function objectFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const work = workForEntity(view, record);
  return [
    ...linksFact(
      view,
      "museum.onchain.record.work",
      work === null ? [] : [work]
    ),
    ...identifierFacts(record),
    ...textFact("museum.onchain.record.creditLine", creditLineOf(view, record)),
    ...linksFact(
      view,
      "museum.onchain.record.objectRecords",
      view
        .recordsAbout(record)
        .filter((item) => familyOf(item) !== "PRV_DOCUMENT")
    ),
  ];
}

/** Files a digital object's `body.media` names, by role and type. */
function mediaFacts(record: OnchainMuseumRecord): Fact[] {
  const media = bodyOf(record)["media"];
  const files = (Array.isArray(media) ? media : []).filter(isPlainObject);
  return [
    {
      label: t(locale, "museum.onchain.record.files"),
      value:
        files.length === 0
          ? t(locale, "museum.onchain.record.noFiles")
          : files
              .map((file) => {
                const content = asRecord(file["content"]);
                const role = file["role"];
                const type = content?.["media_type"];
                const bytes = content?.["bytes"];
                return t(locale, "museum.onchain.record.file", {
                  role: registryValueLabel(
                    "mediaRole",
                    typeof role === "string" ? role : ""
                  ),
                  type: typeof type === "string" ? type : "",
                  bytes: formatCount(typeof bytes === "number" ? bytes : 0),
                });
              })
              .join("; "),
    },
  ];
}

function entityFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const kind = record.profile?.kind;
  if (kind === "work") return workFacts(view, record);
  if (kind === "object") return objectFacts(view, record);
  const body = bodyOf(record);
  const members = body["members"];
  return [
    ...refsFact(
      view,
      "museum.onchain.record.createdBy",
      agentRefs(body["created_by"])
    ),
    ...textFact("museum.onchain.record.date", bodyText(record, "date")),
    ...textFact(
      "museum.onchain.record.description",
      bodyText(record, "description")
    ),
    ...identifierFacts(record),
    ...refsFact(
      view,
      "museum.onchain.record.members",
      Array.isArray(members) ? members : []
    ),
    ...(kind === "digital_object" ? mediaFacts(record) : []),
  ];
}

function relationFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const body = bodyOf(record);
  const role = asRecord(body["qualifier"])?.["role"];
  return [
    {
      label: t(locale, "museum.onchain.record.relationType"),
      value: registryValueLabel("relationKind", record.profile?.kind ?? ""),
    },
    ...refsFact(view, "museum.onchain.record.source", [body["source"]]),
    ...refsFact(view, "museum.onchain.record.target", [body["target"]]),
    ...textFact(
      "museum.onchain.record.role",
      typeof role === "string" ? role : null
    ),
  ];
}

function aboutFact(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  return refsFact(
    view,
    "museum.onchain.record.aboutRecords",
    (record.profile?.about ?? []).map((item) => item.ref)
  );
}

function rightsFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const body = bodyOf(record);
  const licence = asRecord(body["licence"]);
  const uri = licence?.["uri"];
  return [
    {
      label: t(locale, "museum.onchain.record.rightsStatus"),
      value: registryValueLabel("rightsStatus", String(body["status"])),
    },
    ...(typeof licence?.["name"] === "string"
      ? [
          {
            label: t(locale, "museum.onchain.record.licence"),
            value:
              typeof uri === "string" && uri.startsWith("https://") ? (
                <a href={uri} rel="noreferrer" className={TEXT_LINK}>
                  {licence["name"]}
                </a>
              ) : (
                licence["name"]
              ),
          },
        ]
      : []),
    ...textFact("museum.onchain.record.terms", bodyText(record, "terms")),
    ...aboutFact(view, record),
  ];
}

function decisionFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const body = bodyOf(record);
  return [
    {
      label: t(locale, "museum.onchain.record.outcome"),
      value: registryValueLabel("outcome", String(body["outcome"])),
    },
    ...textFact("museum.onchain.record.statement", bodyText(record, "text")),
    ...refsFact(
      view,
      "museum.onchain.record.decidedBy",
      agentRefs(body["decided_by"])
    ),
    ...aboutFact(view, record),
  ];
}

function observationFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const body = bodyOf(record);
  const method = asRecord(body["method"])?.["name"];
  const from = body["observed_from"];
  const to = body["observed_to"];
  let observed: string | null = null;
  if (typeof from === "string" && typeof to === "string") {
    const time = (value: string) => formatUtcDateTime(Date.parse(value) / 1000);
    observed = from === to ? time(from) : `${time(from)} – ${time(to)}`;
  }
  return [
    ...textFact(
      "museum.onchain.record.method",
      typeof method === "string" ? registryValueLabel("method", method) : null
    ),
    ...refsFact(view, "museum.onchain.record.observationTarget", [
      body["target"],
    ]),
    ...textFact("museum.onchain.record.observed", observed),
  ];
}

function statementFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const family = familyOf(record);
  if (family === "PRV_RIGHTS") return rightsFacts(view, record);
  if (family === "PRV_DECISION") return decisionFacts(view, record);
  if (family === "PRV_OBSERVATION") return observationFacts(view, record);
  return aboutFact(view, record);
}

function documentFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  return [
    ...textFact(
      "museum.onchain.record.language",
      languageText(bodyOf(record)["content_lang"])
    ),
    ...refsFact(
      view,
      "museum.onchain.record.authors",
      agentRefs(bodyOf(record)["authors"])
    ),
    ...aboutFact(view, record),
  ];
}

/** What a verified record states, by its profile family and kind. */
export function captionFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const { profile } = record;
  if (profile === null) return [];
  const family = familyOf(record);
  let facts: Fact[];
  if (family === "PRV_ENTITY") facts = entityFacts(view, record);
  else if (family === "PRV_RELATION") facts = relationFacts(view, record);
  else if (family === "PRV_DOCUMENT") facts = documentFacts(view, record);
  else if (family === "PRV_REGISTRY") facts = [];
  else facts = statementFacts(view, record);
  return [
    ...facts,
    ...(family === "PRV_REGISTRY"
      ? []
      : [
          {
            label: t(locale, "museum.onchain.record.entityId"),
            value: <Mono>{profile.localId}</Mono>,
          },
        ]),
    {
      label: t(locale, "museum.onchain.record.status"),
      value: registryValueLabel("status", profile.status),
    },
    ...(profile.assertionMode === null
      ? []
      : [
          {
            label: t(locale, "museum.onchain.record.assertion"),
            value: registryValueLabel("assertion", profile.assertionMode),
          },
        ]),
  ];
}
