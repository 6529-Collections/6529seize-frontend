import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type {
  OnchainMuseumRecord,
  OnchainRecordState,
} from "@/lib/museum/onchain/museum";
import {
  bodyText,
  documentPath,
  familyOf,
  identifiersOf,
  museumExtString,
  ONCHAIN_MUSEUM_BASE_PATH,
  ONCHAIN_MUSEUM_TEXTS_HREF,
  onchainMuseumRecordHref,
  parseSubjectIdParam,
} from "@/lib/museum/onchain/fields";
import {
  type OnchainEdge,
  type OnchainMuseumView,
} from "@/lib/museum/onchain/presentation";
import { textsNaming } from "@/lib/museum/onchain/texts";
import { getOnchainMuseum } from "@/lib/museum/onchain/runtime.server";
import {
  isGenerative,
  memberships,
  workImage,
  worksAbout,
} from "@/lib/museum/onchain/works";
import { registryValueLabel } from "../../_components/labels";
import { onchainMuseumMetadata } from "../../_components/metadata";
import {
  FactList,
  LIST_LINK,
  PageHeading,
  PayloadTree,
  SectionHeading,
  StateBadge,
  TEXT_LINK,
} from "../../_components/OnchainParts";
import { OnchainFacts } from "../../_components/OnchainFacts";
import { OnchainUnavailable } from "../../_components/OnchainUnavailable";
import {
  captionFacts,
  EntityLink,
  RecordLinks,
} from "../../_components/RecordFacts";
import { WorkFigure } from "../../_components/WorkFigure";
import { onchainMuseumView } from "../../_components/view";

const locale = DEFAULT_LOCALE;
const NO_COMMIT = /^0x0*$/u;

interface OnchainRecordRouteProps {
  readonly params: Promise<{ subjectId: string }>;
}

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
  nonconforming: "museum.onchain.stateDetail.nonconforming",
  mismatch: "museum.onchain.stateDetail.mismatch",
  unavailable: "museum.onchain.stateDetail.unavailable",
  unsupported: "museum.onchain.stateDetail.unsupported",
  deleted: "museum.onchain.stateDetail.deleted",
} as const satisfies Record<
  Exclude<OnchainRecordState, "verified">,
  MessageKey
>;

const TEXT_DETAIL_KEYS = {
  text_mismatch: "museum.onchain.stateDetail.textMismatch",
  text_unavailable: "museum.onchain.stateDetail.textUnavailable",
  text_unsupported: "museum.onchain.stateDetail.textUnsupported",
  text_reference: "museum.onchain.stateDetail.textUnsupported",
} as const satisfies Record<string, MessageKey>;

function stateDetail(record: OnchainMuseumRecord, fixture: boolean): string {
  if (record.state === "verified" && fixture) {
    return t(
      locale,
      record.text === null
        ? "museum.onchain.stateDetail.verifiedFixture"
        : "museum.onchain.stateDetail.verifiedTextFixture"
    );
  }
  if (record.state === "verified") {
    const cid =
      record.cidMatches === true
        ? t(locale, "museum.onchain.stateDetail.cid")
        : "";
    return record.text === null
      ? t(locale, "museum.onchain.stateDetail.verified", { cid })
      : t(locale, "museum.onchain.stateDetail.verifiedText", { cid });
  }
  const check = record.check ?? "";
  if (Object.hasOwn(TEXT_DETAIL_KEYS, check)) {
    return t(locale, TEXT_DETAIL_KEYS[check as keyof typeof TEXT_DETAIL_KEYS]);
  }
  return t(locale, STATE_DETAIL_KEYS[record.state]);
}

/** Text groups for the sets and programs a work belongs to. */
function workTextGroups(view: OnchainMuseumView, record: OnchainMuseumRecord) {
  const contexts = new Set(
    ["accession", "acquisition", "program"].flatMap((key) =>
      memberships(view, record, key).map((item) => item.subjectId)
    )
  );
  // One link per context: a program's texts sit in several folders.
  const seen = new Set<string>();
  return view.textGroups.filter((group) => {
    const context = group.contextSubjectId;
    if (context === null || !contexts.has(context) || seen.has(context)) {
      return false;
    }
    seen.add(context);
    return true;
  });
}

/** Texts that name this work or artist, and the text groups it belongs to. */
function RelatedTexts({
  view,
  record,
}: Readonly<{ view: OnchainMuseumView; record: OnchainMuseumRecord }>) {
  const groupKey = view.groupKeyOf(record);
  if (groupKey !== "work" && groupKey !== "artist") return null;
  const texts = textsNaming(
    view,
    bodyText(record, "label") ?? record.label,
    groupKey === "work" ? "equals" : "includes"
  );
  const groups = groupKey === "work" ? workTextGroups(view, record) : [];
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

/** The record's relations, by kind and direction. */
function connectionGroups(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): Map<string, OnchainEdge[]> {
  const groups = new Map<string, OnchainEdge[]>();
  for (const edge of view.edgesOf(record)) {
    // What an artist created splits into works and everything else.
    const works =
      edge.kind === "created_by" &&
      edge.direction === "in" &&
      edge.other !== null &&
      view.groupKeyOf(edge.other) === "work";
    const key = works ? "created_by.in.work" : `${edge.kind}.${edge.direction}`;
    groups.set(key, [...(groups.get(key) ?? []), edge]);
  }
  return groups;
}

/** A work's year and accession number, beside its name in a list. */
function WorkDetail({
  view,
  record,
}: Readonly<{ view: OnchainMuseumView; record: OnchainMuseumRecord }>) {
  if (view.groupKeyOf(record) !== "work") return null;
  const parts = [
    bodyText(record, "date"),
    identifiersOf(record, "accession_number")[0] ?? null,
  ].filter((part): part is string => part !== null);
  return parts.length === 0 ? null : (
    <span className="tw-text-iron-400">{parts.join(" · ")}</span>
  );
}

function Connections({
  view,
  record,
}: Readonly<{ view: OnchainMuseumView; record: OnchainMuseumRecord }>) {
  if (familyOf(record) !== "PRV_ENTITY") return null;
  const groups = connectionGroups(view, record);
  if (groups.size === 0) return null;
  const noImage =
    view.groupKeyOf(record) === "work" && workImage(view, record) === null;
  return (
    <section aria-labelledby="record-connections" className="tw-mb-10">
      <SectionHeading id="record-connections">
        {t(locale, "museum.onchain.record.relations")}
      </SectionHeading>
      <div className="tw-mt-4 tw-grid tw-gap-x-10 tw-gap-y-6 md:tw-grid-cols-2">
        {[...groups.entries()].map(([key, edges]) => {
          const headingId = `connections-${key.replaceAll(/[^a-z]+/gu, "-")}`;
          return (
            <div key={key} className="tw-min-w-0">
              <h3
                id={headingId}
                className="tw-m-0 tw-mb-2 tw-text-base tw-font-semibold tw-text-iron-100"
              >
                {registryValueLabel("connection", key)}{" "}
                <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                  ({edges.length})
                </span>
              </h3>
              {key === "documents.in" && noImage ? (
                <p className="tw-m-0 tw-mb-2 tw-text-sm tw-text-iron-400">
                  {t(locale, "museum.onchain.record.mediaNote")}
                </p>
              ) : null}
              <ul
                aria-labelledby={headingId}
                className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0"
              >
                {edges.map((edge) => (
                  <li
                    key={edge.relation.subjectId}
                    className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-sm tw-leading-6"
                  >
                    <EntityLink link={view.resolveRef(edge.otherRef)} />
                    {edge.other === null ? null : (
                      <WorkDetail view={view} record={edge.other} />
                    )}
                    <Link
                      href={onchainMuseumRecordHref(edge.relation.subjectId)}
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
  const named =
    familyOf(record) === "PRV_DOCUMENT" ? worksAbout(view, record) : [];
  // A text about one or a few works names them.
  const works = named.length > 0 && named.length <= 3 ? named : [];
  const isWork = view.groupKeyOf(record) === "work";
  const route = museumExtString(record, "canonical_route");
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
          {stateDetail(record, view.snapshot.source === "fixture")}
        </p>
      </div>
      {isWork && workImage(view, record) === null ? (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            locale,
            isGenerative(record)
              ? "museum.onchain.image.generative"
              : "museum.onchain.image.none"
          )}
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
  const isDocument = familyOf(record) === "PRV_DOCUMENT";
  const release = view.snapshot.registry.releases.find(
    (item) => item.releaseId === record.version.releaseId
  );
  const sourceCommit =
    release === undefined || NO_COMMIT.test(release.sourceCommit)
      ? null
      : release.sourceCommit.slice(2);
  const caption = captionFacts(view, record);
  const image = workImage(view, record);
  const text = record.text?.state === "verified" ? record.text.text : null;

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

      {text === null ? null : (
        <section
          aria-label={t(locale, "museum.onchain.record.document")}
          className="tw-mb-12 tw-max-w-3xl"
        >
          <MuseumMarkdown
            sourceCommit={sourceCommit}
            sourcePath={documentPath(record) ?? undefined}
            className="tw-break-words"
            embeddedDocument
          >
            {text}
          </MuseumMarkdown>
        </section>
      )}

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
      <OnchainFacts
        record={record}
        fixture={view.snapshot.source === "fixture"}
      />

      {record.content === null ? null : (
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
      )}
    </article>
  );
}
