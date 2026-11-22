import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { compareLocalized } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { cidToText } from "@/lib/museum/onchain/cid";
import type { OnchainMuseumSnapshot } from "@/lib/museum/onchain/museum";
import {
  buildOnchainMuseumIndex,
  ONCHAIN_MUSEUM_TEXTS_HREF,
} from "@/lib/museum/onchain/presentation";
import { getOnchainMuseum } from "@/lib/museum/onchain/runtime.server";
import { onchainMuseumMetadata } from "./_components/metadata";
import {
  entityTypeLabel,
  FactList,
  formatCount,
  formatUtcDateTime,
  Mono,
  PageHeading,
  RecordList,
  SectionHeading,
  TEXT_LINK,
} from "./_components/OnchainParts";
import { OnchainUnavailable } from "./_components/OnchainUnavailable";

const locale = DEFAULT_LOCALE;

export const metadata: Metadata = onchainMuseumMetadata(
  t(locale, "museum.onchain.title"),
  t(locale, "museum.onchain.description")
);

function CheckRow({
  passed,
  label,
}: Readonly<{ passed: boolean; label: string }>) {
  return (
    <li
      data-check={passed ? "pass" : "fail"}
      className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-leading-6"
    >
      <span
        aria-hidden="true"
        className={`tw-mt-0.5 tw-inline-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-xs tw-font-bold ${
          passed
            ? "tw-bg-emerald-400/20 tw-text-emerald-200"
            : "tw-bg-red-400/20 tw-text-red-200"
        }`}
      >
        {passed ? "✓" : "!"}
      </span>
      <span className="tw-text-iron-100">
        {label}
        <span className="tw-sr-only">
          {": "}
          {t(
            locale,
            passed ? "museum.onchain.check.pass" : "museum.onchain.check.fail"
          )}
        </span>
      </span>
    </li>
  );
}

function VerificationSummary({
  snapshot,
}: Readonly<{ snapshot: OnchainMuseumSnapshot }>) {
  const { checks } = snapshot.registry;
  const total = snapshot.records.length;
  const failures = total - snapshot.counts.verified;
  return (
    <section
      aria-labelledby="onchain-verification"
      className="tw-mb-12 tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-5 sm:tw-p-6"
    >
      <SectionHeading id="onchain-verification">
        {t(locale, "museum.onchain.summary.heading")}
      </SectionHeading>
      <p className="tw-m-0 tw-mt-3 tw-text-lg tw-font-medium tw-text-iron-50">
        {t(locale, "museum.onchain.summary.records", {
          verified: formatCount(snapshot.counts.verified),
          total: formatCount(total),
        })}
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
        {t(locale, "museum.onchain.summary.block", {
          block: formatCount(snapshot.registry.blockNumber),
          date: formatUtcDateTime(snapshot.registry.blockTimestamp),
        })}
      </p>
      <ul className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-2 tw-p-0 md:tw-grid-cols-2">
        <CheckRow
          passed={checks.codeHashMatches}
          label={t(locale, "museum.onchain.check.codeHash")}
        />
        <CheckRow
          passed={checks.supportsRegistryInterface && checks.erc165Conforms}
          label={t(locale, "museum.onchain.check.interface")}
        />
        <CheckRow
          passed={checks.ownerMatches}
          label={t(locale, "museum.onchain.check.owner")}
        />
        <CheckRow
          passed={snapshot.catalog.state === "verified"}
          label={t(locale, "museum.onchain.check.catalog")}
        />
      </ul>
      {checks.frozen ? (
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-300">
          {t(locale, "museum.onchain.check.frozen")}
        </p>
      ) : null}
      {failures > 0 ? (
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-text-yellow-100">
          {t(locale, "museum.onchain.summary.failures", {
            count: formatCount(failures),
          })}
        </p>
      ) : null}
      <div className="tw-mt-5">
        <FactList
          facts={[
            {
              label: t(locale, "museum.onchain.field.registry"),
              value: (
                <a
                  href={`https://sepolia.etherscan.io/address/${snapshot.registry.registry}`}
                  rel="noreferrer"
                  className={TEXT_LINK}
                >
                  <Mono>{snapshot.registry.registry}</Mono>
                </a>
              ),
            },
          ]}
        />
      </div>
    </section>
  );
}

function Releases({ snapshot }: Readonly<{ snapshot: OnchainMuseumSnapshot }>) {
  return (
    <section aria-labelledby="onchain-releases" className="tw-mb-12">
      <SectionHeading id="onchain-releases">
        {t(locale, "museum.onchain.releases.heading")}
      </SectionHeading>
      <ol className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-gap-4 tw-p-0 lg:tw-grid-cols-2">
        {snapshot.registry.releases.map((release) => (
          <li
            key={release.releaseId}
            className="tw-min-w-0 tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-p-5"
          >
            <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
              {t(locale, "museum.onchain.releases.item", {
                id: release.releaseId,
              })}
            </h3>
            <p className="tw-m-0 tw-mt-1 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-300">
              {release.label}
            </p>
            <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
              {t(locale, "museum.onchain.releases.records", {
                count: formatCount(release.recordCount),
              })}
              {" · "}
              {release.isSealed
                ? t(locale, "museum.onchain.releases.sealed", {
                    date: formatUtcDateTime(release.sealedAt),
                  })
                : t(locale, "museum.onchain.releases.open")}
            </p>
            <div className="tw-mt-4">
              <FactList
                facts={[
                  {
                    label: t(locale, "museum.onchain.releases.sourceCommit"),
                    value: <Mono>{release.sourceCommit.slice(2)}</Mono>,
                  },
                  {
                    label: t(locale, "museum.onchain.releases.manifest"),
                    value:
                      release.manifestCid === "0x" ? (
                        "-"
                      ) : (
                        <Mono>{cidToText(release.manifestCid)}</Mono>
                      ),
                  },
                ]}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function OnchainMuseumPage() {
  await connection();
  const state = await getOnchainMuseum();
  if (state.status !== "ready") return <OnchainUnavailable />;
  const { snapshot } = state;
  const index = buildOnchainMuseumIndex(snapshot, (left, right) =>
    compareLocalized(locale, left, right)
  );

  return (
    <>
      <PageHeading
        eyebrow={t(locale, "museum.onchain.eyebrow")}
        title={t(locale, "museum.onchain.heading")}
        intro={t(locale, "museum.onchain.intro")}
      />
      <VerificationSummary snapshot={snapshot} />
      <Releases snapshot={snapshot} />

      <section aria-labelledby="onchain-texts" className="tw-mb-12">
        <SectionHeading id="onchain-texts">
          {t(locale, "museum.onchain.texts.heading")}
        </SectionHeading>
        <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
          {t(locale, "museum.onchain.texts.summary", {
            count: formatCount(index.texts.length),
          })}{" "}
          <Link href={ONCHAIN_MUSEUM_TEXTS_HREF} className={TEXT_LINK}>
            {t(locale, "museum.onchain.texts.open")}
          </Link>
        </p>
      </section>

      <section aria-labelledby="onchain-collection" className="tw-mb-12">
        <SectionHeading id="onchain-collection">
          {t(locale, "museum.onchain.collection.heading")}
        </SectionHeading>
        <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(locale, "museum.onchain.collection.intro")}{" "}
          {t(locale, "museum.onchain.relations.summary", {
            count: formatCount(index.relationCount),
          })}
        </p>
        {index.entityGroups.map((group) => {
          const id = `onchain-entities-${group.key.toLowerCase()}`;
          return (
            <div key={group.key} className="tw-mt-8">
              <h3
                id={id}
                className="tw-m-0 tw-mb-2 tw-text-lg tw-font-semibold tw-text-iron-50"
              >
                {entityTypeLabel(group.key)}{" "}
                <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                  ({formatCount(group.records.length)})
                </span>
              </h3>
              <RecordList records={group.records} labelledBy={id} />
            </div>
          );
        })}
      </section>

      <section aria-labelledby="onchain-records" className="tw-mb-12">
        <SectionHeading id="onchain-records">
          {t(locale, "museum.onchain.records.heading")}
        </SectionHeading>
        {index.recordGroups.map((group) => {
          const id = `onchain-records-${group.key.toLowerCase()}`;
          return (
            <div key={group.key} className="tw-mt-8">
              <h3
                id={id}
                className="tw-m-0 tw-mb-2 tw-break-words tw-font-mono tw-text-base tw-font-semibold tw-text-iron-50"
              >
                {group.key}{" "}
                <span className="tw-font-sans tw-text-sm tw-font-normal tw-text-iron-400">
                  ({formatCount(group.records.length)})
                </span>
              </h3>
              <RecordList records={group.records} labelledBy={id} />
            </div>
          );
        })}
      </section>

      {index.unverified.length > 0 ? (
        <section aria-labelledby="onchain-unverified" className="tw-mb-12">
          <SectionHeading id="onchain-unverified">
            {t(locale, "museum.onchain.unverified.heading")}
          </SectionHeading>
          <div className="tw-mt-4">
            <RecordList
              records={index.unverified}
              labelledBy="onchain-unverified"
            />
          </div>
        </section>
      ) : null}
    </>
  );
}
