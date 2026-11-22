import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type { OnchainMuseumRecord } from "@/lib/museum/onchain/museum";
import {
  asRecord,
  ONCHAIN_MUSEUM_BASE_PATH,
  ONCHAIN_MUSEUM_TEXTS_HREF,
  onchainMuseumRecordHref,
  parseSubjectIdParam,
  payloadRecord,
  payloadString,
  payloadStrings,
  relationsReferencing,
  textsNaming,
  workImage,
  worksNamedBy,
  type OnchainLink,
  type OnchainMuseumView,
} from "@/lib/museum/onchain/presentation";
import { getOnchainMuseum } from "@/lib/museum/onchain/runtime.server";
import { registryValueLabel } from "../../_components/labels";
import { onchainMuseumMetadata } from "../../_components/metadata";
import {
  FactList,
  LIST_LINK,
  Mono,
  PageHeading,
  PayloadTree,
  SectionHeading,
  StateBadge,
  statusLabel,
  TEXT_LINK,
} from "../../_components/OnchainParts";
import { OnchainFacts } from "../../_components/OnchainFacts";
import { OnchainUnavailable } from "../../_components/OnchainUnavailable";
import { WorkFigure } from "../../_components/WorkFigure";
import { onchainMuseumView } from "../../_components/view";

const locale = DEFAULT_LOCALE;

interface OnchainRecordRouteProps {
  readonly params: Promise<{ subjectId: string }>;
}

type Fact = { label: string; value: ReactNode };

async function loadRecord(
  params: OnchainRecordRouteProps["params"]
): Promise<
  | { view: OnchainMuseumView; record: OnchainMuseumRecord }
  | "unavailable"
  | null
> {
  const { subjectId } = await params;
  const id = parseSubjectIdParam(subjectId);
  if (id === null) return null;
  const state = await getOnchainMuseum();
  if (state.status !== "ready") return "unavailable";
  const view = onchainMuseumView(state.snapshot);
  const record = view.find(id);
  return record === null ? null : { view, record };
}

export async function generateMetadata({
  params,
}: OnchainRecordRouteProps): Promise<Metadata> {
  await connection();
  const loaded = await loadRecord(params);
  const title =
    loaded === null || loaded === "unavailable"
      ? t(locale, "museum.onchain.title")
      : loaded.view.labelOf(loaded.record);
  return onchainMuseumMetadata(title, t(locale, "museum.onchain.description"));
}

const STATE_DETAIL_KEYS = {
  mismatch: "museum.onchain.stateDetail.mismatch",
  unavailable: "museum.onchain.stateDetail.unavailable",
  unsupported: "museum.onchain.stateDetail.unsupported",
  deleted: "museum.onchain.stateDetail.deleted",
} as const satisfies Record<string, MessageKey>;

function stateDetail(record: OnchainMuseumRecord): string {
  if (record.state === "verified") {
    return t(locale, "museum.onchain.stateDetail.verified", {
      cid:
        record.cidMatches === true
          ? t(locale, "museum.onchain.stateDetail.cid")
          : "",
    });
  }
  return t(locale, STATE_DETAIL_KEYS[record.state]);
}

function EntityLink({ link }: Readonly<{ link: OnchainLink }>) {
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

function LinkList({ links }: Readonly<{ links: readonly OnchainLink[] }>) {
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
      {links.map((link) => (
        <li key={link.id}>
          <EntityLink link={link} />
        </li>
      ))}
    </ul>
  );
}

function RecordLinks({
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

/** Distinct links, without the record the page is about. */
function linksExcept(
  view: OnchainMuseumView,
  ids: readonly string[],
  self: OnchainMuseumRecord
): OnchainLink[] {
  const seen = new Set<string>();
  const links: OnchainLink[] = [];
  for (const id of ids) {
    const link = view.resolve(id);
    if (link.subjectId?.toLowerCase() === self.subjectId.toLowerCase())
      continue;
    const key = link.href ?? link.id;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push(link);
  }
  return links;
}

function profileStrings(record: OnchainMuseumRecord, key: string): string[] {
  return payloadStrings(payloadRecord(record, "profile")?.[key]);
}

function workFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const profile = payloadRecord(record, "profile");
  const facts: Fact[] = [];
  const creators = linksExcept(
    view,
    profileStrings(record, "creator_entity_ids"),
    record
  );
  if (creators.length > 0) {
    facts.push({
      label: t(locale, "museum.onchain.record.creators"),
      value: <LinkList links={creators} />,
    });
  }
  const date = asRecord(profile?.["creation_date"]);
  if (
    date?.["status"] === "established" &&
    typeof date["display"] === "string"
  ) {
    facts.push({
      label: t(locale, "museum.onchain.record.date"),
      value: date["display"],
    });
  }
  const medium = profile?.["medium"];
  if (typeof medium === "string" && medium.trim() !== "") {
    facts.push({
      label: t(locale, "museum.onchain.record.medium"),
      value: medium,
    });
  }
  const membership = asRecord(profile?.["collection_membership"]);
  if (typeof membership?.["status"] === "string") {
    facts.push({
      label: t(locale, "museum.onchain.record.collection"),
      value: statusLabel(membership["status"]),
    });
  }
  const groups: [MessageKey, string][] = [
    ["museum.onchain.record.accession", "accession_entity_ids"],
    ["museum.onchain.record.acquisition", "acquisition_entity_ids"],
    ["museum.onchain.record.project", "project_or_series_entity_ids"],
  ];
  for (const [label, key] of groups) {
    const links = linksExcept(view, profileStrings(record, key), record);
    if (links.length > 0) {
      facts.push({
        label: t(locale, label),
        value: <LinkList links={links} />,
      });
    }
  }
  const components = Array.isArray(profile?.["component_references"])
    ? (profile["component_references"] as unknown[])
        .map((item) => asRecord(item)?.["record_id"])
        .filter((id): id is string => typeof id === "string")
    : [];
  const descriptions = components
    .map((id) => view.recordById(id))
    .filter((item): item is OnchainMuseumRecord => item !== null);
  for (const description of descriptions) {
    const credit = payloadString(description, "credit_line");
    if (credit !== null) {
      facts.push({
        label: t(locale, "museum.onchain.record.creditLine"),
        value: credit,
      });
      break;
    }
  }
  const objectRecords = objectRecordsOf(view, record, components);
  if (objectRecords.length > 0) {
    facts.push({
      label: t(locale, "museum.onchain.record.objectRecords"),
      value: <RecordLinks view={view} records={objectRecords} />,
    });
  }
  return facts;
}

/**
 * The work's own object records (description, condition, rights, gift
 * acceptance): records, not entities, that the work names as its sources.
 */
function objectRecordsOf(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord,
  components: readonly string[]
): OnchainMuseumRecord[] {
  const ids = [
    ...components,
    ...payloadStrings(
      record.content?.kind === "json"
        ? record.content.payload["source_record_ids"]
        : []
    ),
  ];
  const seen = new Set<string>();
  const found: OnchainMuseumRecord[] = [];
  for (const id of ids) {
    const item = view.recordById(id);
    if (item === null || isEntityOrRelation(item) || seen.has(item.subjectId)) {
      continue;
    }
    seen.add(item.subjectId);
    found.push(item);
  }
  return found;
}

function isEntityOrRelation(record: OnchainMuseumRecord): boolean {
  return (
    record.recordType === "PUBLIC_ENTITY" ||
    record.recordType === "PUBLIC_RELATION" ||
    record.recordType === "PUBLIC_DOCUMENT"
  );
}

function relationFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  const type = payloadString(record, "relation_type");
  const references = linksExcept(
    view,
    payloadStrings(
      record.content?.kind === "json"
        ? record.content.payload["references"]
        : []
    ),
    record
  );
  return [
    ...(type === null
      ? []
      : [
          {
            label: t(locale, "museum.onchain.record.relationType"),
            value: registryValueLabel("relationType", type),
          },
        ]),
    {
      label: t(locale, "museum.onchain.record.references"),
      value: <LinkList links={references} />,
    },
  ];
}

function captionFacts(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Fact[] {
  if (record.content?.kind !== "json") return [];
  const entityType = payloadString(record, "entity_type");
  let facts: Fact[] = [];
  if (record.recordType === "PUBLIC_RELATION") {
    facts = relationFacts(view, record);
  } else if (entityType === "WORK") {
    facts = workFacts(view, record);
  }
  if (record.recordType === "WORK_DESCRIPTION") {
    const credit = payloadString(record, "credit_line");
    if (credit !== null)
      facts.push({
        label: t(locale, "museum.onchain.record.creditLine"),
        value: credit,
      });
  }
  const id =
    payloadString(record, "entity_id") ?? payloadString(record, "record_id");
  if (id !== null) {
    facts.push({
      label: t(locale, "museum.onchain.record.entityId"),
      value: <Mono>{id}</Mono>,
    });
  }
  const status =
    payloadString(record, "entity_status") ??
    payloadString(record, "record_status");
  if (status !== null) {
    facts.push({
      label: t(locale, "museum.onchain.record.status"),
      value: statusLabel(status),
    });
  }
  return facts;
}

/** Texts that name this work or artist, and the text groups it belongs to. */
function RelatedTexts({
  view,
  record,
}: Readonly<{ view: OnchainMuseumView; record: OnchainMuseumRecord }>) {
  const entityType = payloadString(record, "entity_type");
  if (entityType !== "WORK" && entityType !== "ARTIST") return null;
  const title = payloadString(record, "preferred_label") ?? record.label;
  const texts = textsNaming(
    view,
    title,
    entityType === "WORK" ? "equals" : "includes"
  );
  const ids = new Set([
    ...payloadStrings(
      record.content?.kind === "json"
        ? record.content.payload["source_record_ids"]
        : []
    ),
    ...payloadStrings(
      asRecord(payloadRecord(record, "profile")?.["collection_membership"])?.[
        "source_record_ids"
      ]
    ),
  ]);
  const groups = view.textGroups.filter(
    (group) => group.contextId !== null && ids.has(group.contextId)
  );
  if (texts.length === 0 && groups.length === 0) return null;
  return (
    <section aria-labelledby="record-texts" className="tw-mb-10">
      <SectionHeading id="record-texts">
        {t(locale, "museum.onchain.record.texts")}
      </SectionHeading>
      <div className="tw-mt-4 tw-space-y-2 tw-text-base">
        <RecordLinks view={view} records={texts.slice(0, 12)} />
        {groups.length === 0 ? null : (
          <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
            {groups.map((group) => (
              <li key={group.key}>
                <Link
                  href={`${ONCHAIN_MUSEUM_TEXTS_HREF}#${group.anchor}`}
                  className={LIST_LINK}
                >
                  {t(locale, "museum.onchain.record.allTexts", {
                    group: group.heading,
                  })}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Connections({
  view,
  record,
}: Readonly<{ view: OnchainMuseumView; record: OnchainMuseumRecord }>) {
  const entityId = payloadString(record, "entity_id");
  if (entityId === null || record.recordType !== "PUBLIC_ENTITY") return null;
  const byType = new Map<
    string,
    { relation: OnchainMuseumRecord; links: OnchainLink[] }[]
  >();
  for (const relation of relationsReferencing(view.snapshot, entityId)) {
    const type = payloadString(relation, "relation_type") ?? "UNKNOWN";
    const links = linksExcept(
      view,
      payloadStrings(
        relation.content?.kind === "json"
          ? relation.content.payload["references"]
          : []
      ).filter((id) => id !== entityId),
      record
    );
    const entityLinks = links.filter((link) => {
      const target = link.subjectId === null ? null : view.find(link.subjectId);
      return target === null || isEntityOrRelation(target);
    });
    byType.set(type, [
      ...(byType.get(type) ?? []),
      { relation, links: entityLinks.length > 0 ? entityLinks : links },
    ]);
  }
  if (byType.size === 0) return null;
  return (
    <section aria-labelledby="record-connections" className="tw-mb-10">
      <SectionHeading id="record-connections">
        {t(locale, "museum.onchain.record.relations")}
      </SectionHeading>
      <div className="tw-mt-4 tw-grid tw-gap-x-10 tw-gap-y-6 md:tw-grid-cols-2">
        {[...byType.entries()].map(([type, rows]) => {
          const headingId = `connections-${type.toLowerCase()}`;
          return (
            <div key={type} className="tw-min-w-0">
              <h3
                id={headingId}
                className="tw-m-0 tw-mb-2 tw-text-base tw-font-semibold tw-text-iron-100"
              >
                {registryValueLabel("relationType", type)}
              </h3>
              <ul
                aria-labelledby={headingId}
                className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0"
              >
                {rows.map(({ relation, links }) => (
                  <li
                    key={relation.subjectId}
                    className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-sm tw-leading-6"
                  >
                    {links.map((link) => (
                      <EntityLink key={link.id} link={link} />
                    ))}
                    <Link
                      href={onchainMuseumRecordHref(relation.subjectId)}
                      className="hover:tw-text-primary-200 tw-text-xs tw-text-iron-400 tw-underline tw-decoration-iron-600 tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    >
                      {t(locale, "museum.onchain.record.relationRecord")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HeadingAside({
  view,
  record,
}: Readonly<{ view: OnchainMuseumView; record: OnchainMuseumRecord }>) {
  const group = view.textGroupOf(record);
  const contextId = group?.contextSubjectId ?? null;
  const context = contextId === null ? null : view.find(contextId);
  const named = context === null ? [] : worksNamedBy(view, context);
  // A text in a group about one or a few works names them.
  const works = named.length > 0 && named.length <= 3 ? named : [];
  const isWork = payloadString(record, "entity_type") === "WORK";
  const route = payloadString(record, "canonical_route");
  return (
    <div className="tw-mt-5 tw-space-y-3">
      {group === null ? null : (
        <p className="tw-m-0 tw-text-base tw-text-iron-200">
          {t(locale, "museum.onchain.record.partOf")}{" "}
          <Link
            href={
              group.contextHref ??
              `${ONCHAIN_MUSEUM_TEXTS_HREF}#${group.anchor}`
            }
            className={TEXT_LINK}
          >
            {group.heading}
          </Link>
        </p>
      )}
      {works.length === 0 ? null : (
        <p className="tw-m-0 tw-text-base tw-text-iron-200">
          {t(locale, "museum.onchain.record.about")}{" "}
          {works.map((work, index) => (
            <span key={work.subjectId}>
              {index > 0 ? ", " : null}
              <Link
                href={onchainMuseumRecordHref(work.subjectId)}
                className={TEXT_LINK}
              >
                {view.labelOf(work)}
              </Link>
            </span>
          ))}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-start tw-gap-3">
        <StateBadge state={record.state} />
        <p className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-300">
          {stateDetail(record)}
        </p>
      </div>
      {isWork && workImage(view, record) === null ? (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "museum.onchain.image.none")}
          {route?.startsWith("/museum/network/") ? (
            <>
              {" "}
              <Link href={route} className={TEXT_LINK}>
                {t(locale, "museum.onchain.image.siteLink")}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export default async function OnchainMuseumRecordPage({
  params,
}: OnchainRecordRouteProps) {
  await connection();
  const loaded = await loadRecord(params);
  if (loaded === "unavailable") return <OnchainUnavailable />;
  if (loaded === null) notFound();
  const { view, record } = loaded;
  const isDocument = record.recordType === "PUBLIC_DOCUMENT";
  const release = view.snapshot.registry.releases.find(
    (item) => item.releaseId === record.version.releaseId
  );
  const caption = captionFacts(view, record);
  const image = workImage(view, record);

  return (
    <article data-verification-state={record.state}>
      <p className="tw-m-0 tw-mb-6 tw-text-sm">
        <Link
          href={
            isDocument ? ONCHAIN_MUSEUM_TEXTS_HREF : ONCHAIN_MUSEUM_BASE_PATH
          }
          className={TEXT_LINK}
        >
          {t(
            locale,
            isDocument
              ? "museum.onchain.record.backToTexts"
              : "museum.onchain.record.backToIndex"
          )}
        </Link>
      </p>
      <PageHeading
        eyebrow={view.kindOf(record)}
        title={view.labelOf(record)}
        aside={<HeadingAside view={view} record={record} />}
      />
      {image === null ? null : <WorkFigure view={image} eager />}

      {record.content?.kind === "markdown" ? (
        <section
          aria-label={t(locale, "museum.onchain.record.document")}
          className="tw-mb-12 tw-max-w-3xl"
        >
          <MuseumMarkdown
            sourceCommit={
              release === undefined ? null : release.sourceCommit.slice(2)
            }
            sourcePath={record.documentPath ?? undefined}
            className="tw-break-words"
            embeddedDocument
          >
            {record.content.text}
          </MuseumMarkdown>
        </section>
      ) : null}

      {caption.length === 0 ? null : (
        <section aria-labelledby="record-caption" className="tw-mb-10">
          <SectionHeading id="record-caption">
            {t(locale, "museum.onchain.record.caption")}
          </SectionHeading>
          <div className="tw-mt-4">
            <FactList facts={caption} />
          </div>
        </section>
      )}
      <RelatedTexts view={view} record={record} />
      <Connections view={view} record={record} />
      <OnchainFacts record={record} />

      {record.content?.kind === "json" ? (
        <section aria-labelledby="record-payload" className="tw-mb-10">
          <SectionHeading id="record-payload">
            {t(locale, "museum.onchain.record.payload")}
          </SectionHeading>
          <details className="tw-mt-4">
            <summary className="tw-cursor-pointer tw-text-sm tw-text-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
              {t(locale, "museum.onchain.record.payloadSummary")}
            </summary>
            <div className="tw-mt-4">
              <PayloadTree payload={record.content.payload} />
            </div>
          </details>
        </section>
      ) : null}
    </article>
  );
}
