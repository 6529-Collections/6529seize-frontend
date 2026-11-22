import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type {
  OnchainMuseumRecord,
  OnchainMuseumSnapshot,
} from "@/lib/museum/onchain/museum";
import {
  buildEntityResolver,
  findOnchainRecord,
  ONCHAIN_MUSEUM_BASE_PATH,
  ONCHAIN_MUSEUM_TEXTS_HREF,
  onchainMuseumRecordHref,
  parseSubjectIdParam,
  payloadRecord,
  payloadString,
  payloadStrings,
  relationsReferencing,
  type OnchainEntityLink,
} from "@/lib/museum/onchain/presentation";
import { getOnchainMuseum } from "@/lib/museum/onchain/runtime.server";
import { onchainMuseumMetadata } from "../../_components/metadata";
import {
  algorithmLabel,
  entityTypeLabel,
  FactList,
  formatCount,
  formatUtcDateTime,
  literalLabel,
  Mono,
  PageHeading,
  PayloadTree,
  SectionHeading,
  StateBadge,
  TEXT_LINK,
} from "../../_components/OnchainParts";
import { OnchainUnavailable } from "../../_components/OnchainUnavailable";

const locale = DEFAULT_LOCALE;
const IPFS_RESOLVER = "https://media.6529.io/ipfs/";

interface OnchainRecordRouteProps {
  readonly params: Promise<{ subjectId: string }>;
}

async function loadRecord(
  params: OnchainRecordRouteProps["params"]
): Promise<
  | { snapshot: OnchainMuseumSnapshot; record: OnchainMuseumRecord }
  | "unavailable"
  | null
> {
  const { subjectId } = await params;
  const id = parseSubjectIdParam(subjectId);
  if (id === null) return null;
  const state = await getOnchainMuseum();
  if (state.status !== "ready") return "unavailable";
  const record = findOnchainRecord(state.snapshot, id);
  return record === null ? null : { snapshot: state.snapshot, record };
}

export async function generateMetadata({
  params,
}: OnchainRecordRouteProps): Promise<Metadata> {
  await connection();
  const loaded = await loadRecord(params);
  const title =
    loaded === null || loaded === "unavailable"
      ? t(locale, "museum.onchain.title")
      : loaded.record.label;
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

function EntityLink({ link }: Readonly<{ link: OnchainEntityLink }>) {
  return link.href === null ? (
    <Mono>{link.id}</Mono>
  ) : (
    <Link href={link.href} className={TEXT_LINK}>
      {link.label}
    </Link>
  );
}

function EntityLinks({
  links,
}: Readonly<{ links: readonly OnchainEntityLink[] }>) {
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

function RecordSummary({
  record,
  snapshot,
}: Readonly<{ record: OnchainMuseumRecord; snapshot: OnchainMuseumSnapshot }>) {
  if (record.content?.kind !== "json") return null;
  const resolve = buildEntityResolver(snapshot);
  const facts: { label: string; value: ReactNode }[] = [];
  const entityType = payloadString(record, "entity_type");
  const entityId =
    payloadString(record, "entity_id") ?? payloadString(record, "record_id");
  const profile = payloadRecord(record, "profile");
  if (entityType !== null) {
    facts.push({
      label: t(locale, "museum.onchain.record.entityType"),
      value: entityTypeLabel(entityType),
    });
  }
  if (entityId !== null) {
    facts.push({
      label: t(locale, "museum.onchain.record.entityId"),
      value: <Mono>{entityId}</Mono>,
    });
  }
  const status =
    payloadString(record, "entity_status") ??
    payloadString(record, "record_status");
  if (status !== null) {
    facts.push({
      label: t(locale, "museum.onchain.record.status"),
      value: status,
    });
  }
  const medium = profile?.["medium"] ?? record.content.payload["medium"];
  if (typeof medium === "string" && medium.trim() !== "") {
    facts.push({
      label: t(locale, "museum.onchain.record.medium"),
      value: medium,
    });
  }
  const creators = payloadStrings(profile?.["creator_entity_ids"]);
  if (creators.length > 0) {
    facts.push({
      label: t(locale, "museum.onchain.record.creators"),
      value: <EntityLinks links={creators.map(resolve)} />,
    });
  }
  const relationType = payloadString(record, "relation_type");
  if (relationType !== null) {
    facts.push({
      label: t(locale, "museum.onchain.record.relationType"),
      value: <Mono>{relationType}</Mono>,
    });
    facts.push({
      label: t(locale, "museum.onchain.record.references"),
      value: (
        <EntityLinks
          links={payloadStrings(record.content.payload["references"]).map(
            resolve
          )}
        />
      ),
    });
  }
  const relations =
    entityId !== null && record.recordType === "PUBLIC_ENTITY"
      ? relationsReferencing(snapshot, entityId)
      : [];

  return (
    <section aria-labelledby="onchain-record-summary" className="tw-mb-10">
      <SectionHeading id="onchain-record-summary">
        {t(locale, "museum.onchain.record.summary")}
      </SectionHeading>
      <div className="tw-mt-4">
        <FactList facts={facts} />
      </div>
      {relations.length > 0 ? (
        <div className="tw-mt-8">
          <h3
            id="onchain-record-relations"
            className="tw-m-0 tw-mb-3 tw-text-lg tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "museum.onchain.record.relations")}{" "}
            <span className="tw-text-sm tw-font-normal tw-text-iron-400">
              ({formatCount(relations.length)})
            </span>
          </h3>
          <ul
            aria-labelledby="onchain-record-relations"
            className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0"
          >
            {relations.map((relation) => {
              const others = payloadStrings(
                relation.content?.kind === "json"
                  ? relation.content.payload["references"]
                  : []
              ).filter((id) => id !== entityId);
              return (
                <li
                  key={relation.subjectId}
                  className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-3 tw-text-sm tw-leading-6"
                >
                  <Link
                    href={onchainMuseumRecordHref(relation.subjectId)}
                    className={`tw-font-mono ${TEXT_LINK}`}
                  >
                    {payloadString(relation, "relation_type") ?? relation.label}
                  </Link>
                  {others.length > 0 ? (
                    <span className="tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
                      {others.map((id) => (
                        <EntityLink key={id} link={resolve(id)} />
                      ))}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function OnchainFacts({
  record,
  snapshot,
}: Readonly<{ record: OnchainMuseumRecord; snapshot: OnchainMuseumSnapshot }>) {
  const { version } = record;
  const release = snapshot.registry.releases.find(
    (item) => item.releaseId === version.releaseId
  );
  const facts = [
    {
      label: t(locale, "museum.onchain.field.subject"),
      value: <Mono>{record.subjectId}</Mono>,
    },
    {
      label: t(locale, "museum.onchain.field.recordType"),
      value: <Mono>{literalLabel(record.recordType)}</Mono>,
    },
    {
      label: t(locale, "museum.onchain.field.schema"),
      value: <Mono>{literalLabel(record.schemaLiteral)}</Mono>,
    },
    {
      label: t(locale, "museum.onchain.field.digest"),
      value: (
        <>
          <span className="tw-block tw-text-iron-300">
            {algorithmLabel(version.contentHash.algorithm)}
          </span>
          <Mono>{version.contentHash.digest}</Mono>
        </>
      ),
    },
    {
      label: t(locale, "museum.onchain.field.canonicalization"),
      value: <Mono>{literalLabel(record.canonicalizationLiteral)}</Mono>,
    },
    {
      label: t(locale, "museum.onchain.field.cid"),
      value:
        record.cidText === null ? (
          "-"
        ) : (
          <a
            href={`${IPFS_RESOLVER}${record.cidText}`}
            rel="noreferrer"
            className={TEXT_LINK}
          >
            <Mono>{record.cidText}</Mono>
          </a>
        ),
    },
    {
      label: t(locale, "museum.onchain.field.effectiveAt"),
      value: formatUtcDateTime(version.effectiveAt),
    },
    {
      label: t(locale, "museum.onchain.field.publishedAt"),
      value: formatUtcDateTime(version.publishedAt),
    },
    {
      label: t(locale, "museum.onchain.field.release"),
      value:
        release === undefined
          ? String(version.releaseId)
          : `${t(locale, "museum.onchain.releases.item", { id: release.releaseId })}: ${release.label}`,
    },
    {
      label: t(locale, "museum.onchain.field.sequence"),
      value: formatCount(version.sequence),
    },
    {
      label: t(locale, "museum.onchain.field.version"),
      value: t(locale, "museum.onchain.field.versionValue", {
        version: formatCount(version.version),
        count: formatCount(record.versionCount),
      }),
    },
    {
      label: t(locale, "museum.onchain.field.publisher"),
      value: <Mono>{version.publisher}</Mono>,
    },
    ...(record.documentPath === null
      ? []
      : [
          {
            label: t(locale, "museum.onchain.field.path"),
            value: <Mono>{record.documentPath}</Mono>,
          },
        ]),
    {
      label: t(locale, "museum.onchain.field.verification"),
      value: (
        <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <StateBadge state={record.state} />
          {record.check === null || record.check === "verified" ? null : (
            <Mono>{record.check}</Mono>
          )}
        </span>
      ),
    },
    ...(record.computedDigest === null
      ? []
      : [
          {
            label: t(locale, "museum.onchain.field.computedDigest"),
            value: <Mono>{record.computedDigest}</Mono>,
          },
        ]),
    ...(record.servedBy === null
      ? []
      : [
          {
            label: t(locale, "museum.onchain.field.servedBy"),
            value: <Mono>{record.servedBy}</Mono>,
          },
        ]),
  ];
  return (
    <section aria-labelledby="onchain-record-facts" className="tw-mb-10">
      <SectionHeading id="onchain-record-facts">
        {t(locale, "museum.onchain.record.onchain")}
      </SectionHeading>
      <div className="tw-mt-4">
        <FactList facts={facts} />
      </div>
    </section>
  );
}

export default async function OnchainMuseumRecordPage({
  params,
}: OnchainRecordRouteProps) {
  await connection();
  const loaded = await loadRecord(params);
  if (loaded === "unavailable") return <OnchainUnavailable />;
  if (loaded === null) notFound();
  const { snapshot, record } = loaded;
  const isDocument = record.recordType === "PUBLIC_DOCUMENT";
  const entityType = payloadString(record, "entity_type");
  const release = snapshot.registry.releases.find(
    (item) => item.releaseId === record.version.releaseId
  );

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
        eyebrow={
          entityType === null
            ? literalLabel(record.recordType)
            : entityTypeLabel(entityType)
        }
        title={record.label}
        aside={
          <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-start tw-gap-3">
            <StateBadge state={record.state} />
            <p className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-300">
              {stateDetail(record)}
            </p>
          </div>
        }
      />

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
            embeddedDocument
          >
            {record.content.text}
          </MuseumMarkdown>
        </section>
      ) : null}

      <RecordSummary record={record} snapshot={snapshot} />
      <OnchainFacts record={record} snapshot={snapshot} />

      {record.content?.kind === "json" ? (
        <section aria-labelledby="onchain-record-payload" className="tw-mb-10">
          <SectionHeading id="onchain-record-payload">
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
