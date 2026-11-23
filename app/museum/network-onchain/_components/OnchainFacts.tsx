import Link from "next/link";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type { OnchainMuseumRecord } from "@/lib/museum/onchain/museum";
import { ONCHAIN_MUSEUM_BASE_PATH } from "@/lib/museum/onchain/fields";
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

/** The text a PRV_DOCUMENT names: its content ID, SHA-256 and size. */
function textFacts(record: OnchainMuseumRecord): Fact[] {
  const { text } = record;
  if (text === null) return [];
  const field = (key: MessageKey) => t(locale, key);
  return [
    ...(text.cidText === null
      ? []
      : [
          {
            label: field("museum.onchain.field.textCid"),
            value: (
              <CopyValue
                value={text.cidText}
                field={field("museum.onchain.field.textCid")}
                href={`${IPFS_RESOLVER}${text.cidText}`}
              />
            ),
          },
        ]),
    ...(text.sha256 === null
      ? []
      : [
          {
            label: field("museum.onchain.field.textDigest"),
            value: (
              <>
                <span className="tw-block tw-text-iron-300">
                  {algorithmLabel(2)}
                  {text.byteSize === null
                    ? null
                    : ` · ${t(locale, "museum.onchain.field.bytes", {
                        count: formatCount(text.byteSize),
                      })}`}
                </span>
                <CopyValue
                  value={text.sha256}
                  field={field("museum.onchain.field.textDigest")}
                />
              </>
            ),
          },
        ]),
    ...(text.servedBy === null
      ? []
      : [
          {
            label: field("museum.onchain.field.textServedBy"),
            value: <Mono>{text.servedBy}</Mono>,
          },
        ]),
  ];
}

/** Values only a registry read has: publication time, order and key. */
function publicationFacts(record: OnchainMuseumRecord): Fact[] {
  const { version } = record;
  const field = (key: MessageKey) => t(locale, key);
  return [
    {
      label: field("museum.onchain.field.publishedAt"),
      value: formatUtcDateTime(version.publishedAt),
    },
    {
      label: field("museum.onchain.field.sequence"),
      value: formatCount(version.sequence),
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
    ...(record.servedBy === null
      ? []
      : [
          {
            label: field("museum.onchain.field.servedBy"),
            value: <Mono>{record.servedBy}</Mono>,
          },
        ]),
  ];
}

function failureFacts(record: OnchainMuseumRecord): Fact[] {
  if (record.state === "verified") return [];
  const field = (key: MessageKey) => t(locale, key);
  return [
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
  ];
}

/**
 * The values the registry stores for a record: the ones that identify and
 * check it first, the rest behind a disclosure. A fixture has no
 * publication time, order or publisher, so those are left out.
 */
export function OnchainFacts({
  record,
  fixture,
}: Readonly<{ record: OnchainMuseumRecord; fixture: boolean }>) {
  const { version } = record;
  const field = (key: MessageKey) => t(locale, key);
  const primary: Fact[] = [
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
    ...textFacts(record),
    ...failureFacts(record),
  ];
  const secondary: Fact[] = [
    {
      label: field("museum.onchain.field.schema"),
      value: <Mono>{literalLabel(record.schemaLiteral)}</Mono>,
    },
    {
      label: field("museum.onchain.field.canonicalization"),
      value: canonicalizationLabel(record.canonicalizationLiteral),
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
      label: field("museum.onchain.field.version"),
      value: t(locale, "museum.onchain.field.versionValue", {
        version: formatCount(version.version),
        count: formatCount(record.versionCount),
      }),
    },
    ...(fixture ? [] : publicationFacts(record)),
  ];
  return (
    <section aria-labelledby="record-facts" className="tw-mb-10">
      <SectionHeading id="record-facts">
        {field("museum.onchain.record.onchain")}
      </SectionHeading>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
        {field(
          fixture
            ? "museum.onchain.record.onchainIntroFixture"
            : "museum.onchain.record.onchainIntro"
        )}
      </p>
      <div className="tw-mt-4">
        <FactList facts={primary} />
      </div>
      <details className="tw-mt-4">
        <summary className="tw-cursor-pointer tw-text-sm tw-text-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
          {field("museum.onchain.record.moreStored")}
        </summary>
        <div className="tw-mt-4">
          <FactList facts={secondary} />
        </div>
      </details>
    </section>
  );
}
