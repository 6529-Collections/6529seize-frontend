import Link from "next/link";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type { OnchainMuseumRecord } from "@/lib/museum/onchain/museum";
import { ONCHAIN_MUSEUM_BASE_PATH } from "@/lib/museum/onchain/presentation";
import {
  algorithmLabel,
  canonicalizationLabel,
  CopyValue,
  FactList,
  formatCount,
  formatUtcDateTime,
  literalLabel,
  Mono,
  SectionHeading,
  stateLabel,
  TEXT_LINK,
} from "./OnchainParts";

const locale = DEFAULT_LOCALE;
const IPFS_RESOLVER = "https://media.6529.io/ipfs/";
const ETHERSCAN = "https://sepolia.etherscan.io";

type Fact = { label: string; value: ReactNode };

/** The values the registry stores for a record, as stored. */
export function OnchainFacts({
  record,
}: Readonly<{ record: OnchainMuseumRecord }>) {
  const { version } = record;
  const field = (key: MessageKey) => t(locale, key);
  const facts: Fact[] = [
    {
      label: field("museum.onchain.field.subject"),
      value: (
        <CopyValue
          value={record.subjectId}
          field={field("museum.onchain.field.subject")}
        />
      ),
    },
    {
      label: field("museum.onchain.field.recordType"),
      value: <Mono>{literalLabel(record.recordType)}</Mono>,
    },
    {
      label: field("museum.onchain.field.schema"),
      value: <Mono>{literalLabel(record.schemaLiteral)}</Mono>,
    },
    {
      label: field("museum.onchain.field.digest"),
      value: (
        <>
          <span className="tw-block tw-text-iron-300">
            {algorithmLabel(version.contentHash.algorithm)}
          </span>
          <CopyValue
            value={version.contentHash.digest}
            field={field("museum.onchain.field.digest")}
          />
        </>
      ),
    },
    {
      label: field("museum.onchain.field.canonicalization"),
      value: canonicalizationLabel(record.canonicalizationLiteral),
    },
    {
      label: field("museum.onchain.field.cid"),
      value:
        record.cidText === null ? (
          "-"
        ) : (
          <CopyValue
            value={record.cidText}
            field={field("museum.onchain.field.cid")}
            href={`${IPFS_RESOLVER}${record.cidText}`}
          />
        ),
    },
    {
      label: field("museum.onchain.field.effectiveAt"),
      value: formatUtcDateTime(version.effectiveAt),
    },
    {
      label: field("museum.onchain.field.publishedAt"),
      value: formatUtcDateTime(version.publishedAt),
    },
    {
      label: field("museum.onchain.field.release"),
      value: (
        <Link
          href={`${ONCHAIN_MUSEUM_BASE_PATH}#releases`}
          className={TEXT_LINK}
        >
          {t(locale, "museum.onchain.releases.item", { id: version.releaseId })}
        </Link>
      ),
    },
    {
      label: field("museum.onchain.field.sequence"),
      value: formatCount(version.sequence),
    },
    {
      label: field("museum.onchain.field.version"),
      value: t(locale, "museum.onchain.field.versionValue", {
        version: formatCount(version.version),
        count: formatCount(record.versionCount),
      }),
    },
    {
      label: field("museum.onchain.field.publisher"),
      value: (
        <CopyValue
          value={version.publisher}
          field={field("museum.onchain.field.publisher")}
          href={`${ETHERSCAN}/address/${version.publisher}`}
        />
      ),
    },
    ...(record.documentPath === null
      ? []
      : [
          {
            label: field("museum.onchain.field.path"),
            value: <Mono>{record.documentPath}</Mono>,
          },
        ]),
    ...(record.servedBy === null
      ? []
      : [
          {
            label: field("museum.onchain.field.servedBy"),
            value: <Mono>{record.servedBy}</Mono>,
          },
        ]),
    ...(record.state === "verified"
      ? []
      : [
          {
            label: field("museum.onchain.field.verification"),
            value:
              record.check === null
                ? stateLabel(record.state)
                : `${stateLabel(record.state)} (${record.check})`,
          },
          ...(record.computedDigest === null
            ? []
            : [
                {
                  label: field("museum.onchain.field.computedDigest"),
                  value: <Mono>{record.computedDigest}</Mono>,
                },
              ]),
        ]),
  ];
  return (
    <section aria-labelledby="record-facts" className="tw-mb-10">
      <SectionHeading id="record-facts">
        {field("museum.onchain.record.onchain")}
      </SectionHeading>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
        {field("museum.onchain.record.onchainIntro")}
      </p>
      <div className="tw-mt-4">
        <FactList facts={facts} />
      </div>
    </section>
  );
}
