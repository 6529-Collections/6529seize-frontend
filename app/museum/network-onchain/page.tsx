import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { cidToText } from "@/lib/museum/onchain/cid";
import type { OnchainMuseumSnapshot } from "@/lib/museum/onchain/museum";
import {
  ONCHAIN_MUSEUM_TEXTS_HREF,
  type OnchainMuseumView,
} from "@/lib/museum/onchain/presentation";
import { getOnchainMuseum } from "@/lib/museum/onchain/runtime.server";
import { FilterableGroups } from "./_components/FilterableGroups";
import { onchainMuseumMetadata } from "./_components/metadata";
import {
  CopyValue,
  FactList,
  filterableItem,
  filterCopy,
  formatCount,
  formatUtcDateTime,
  JumpNav,
  PageHeading,
  SectionHeading,
  TEXT_LINK,
} from "./_components/OnchainParts";
import { OnchainUnavailable } from "./_components/OnchainUnavailable";
import { onchainMuseumView } from "./_components/view";

const locale = DEFAULT_LOCALE;
const ETHERSCAN = "https://sepolia.etherscan.io";
const MUSEUM_REPOSITORY =
  "https://github.com/6529-Collections/6529networkmuseum";

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

function Verification({
  snapshot,
}: Readonly<{ snapshot: OnchainMuseumSnapshot }>) {
  const { checks, blockNumber, blockTimestamp, registry } = snapshot.registry;
  const total = snapshot.records.length;
  const failures = total - snapshot.counts.verified;
  return (
    <section
      aria-labelledby="verification"
      className="tw-mb-12 tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-5 sm:tw-p-6"
    >
      <SectionHeading id="verification">
        {t(locale, "museum.onchain.verification.heading")}
      </SectionHeading>
      <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-200">
        {t(locale, "museum.onchain.verification.lead")}
      </p>
      <p className="tw-m-0 tw-mt-4 tw-text-lg tw-font-medium tw-text-iron-50">
        {t(locale, "museum.onchain.verification.records", {
          verified: formatCount(snapshot.counts.verified),
          total: formatCount(total),
        })}
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
        {t(locale, "museum.onchain.verification.block", {
          block: formatCount(blockNumber),
          date: formatUtcDateTime(blockTimestamp),
        })}{" "}
        <a
          href={`${ETHERSCAN}/block/${blockNumber}`}
          rel="noreferrer"
          className={TEXT_LINK}
        >
          {t(locale, "museum.onchain.verification.blockLink", {
            block: formatCount(blockNumber),
          })}
        </a>
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
        {snapshot.media.index.state === "absent" ? null : (
          <CheckRow
            passed={
              snapshot.media.index.state === "verified" &&
              snapshot.media.index.catalogMismatches.length === 0 &&
              snapshot.media.index.cidMismatches.length === 0
            }
            label={t(locale, "museum.onchain.check.fileIndex", {
              count: formatCount(snapshot.media.index.fileCount),
            })}
          />
        )}
      </ul>
      {checks.frozen ? (
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-300">
          {t(locale, "museum.onchain.check.frozen")}
        </p>
      ) : null}
      {failures > 0 ? (
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-text-yellow-100">
          {t(locale, "museum.onchain.verification.failures", {
            count: formatCount(failures),
          })}
        </p>
      ) : null}
      <div className="tw-mt-5">
        <FactList
          facts={[
            {
              label: t(locale, "museum.onchain.verification.registry"),
              value: (
                <CopyValue
                  value={registry}
                  field={t(locale, "museum.onchain.verification.registry")}
                  href={`${ETHERSCAN}/address/${registry}`}
                />
              ),
            },
          ]}
        />
      </div>
    </section>
  );
}

function releaseContents(
  records: number,
  texts: number,
  indexFiles: number | null
): string {
  if (records === 0 && texts === 0 && indexFiles !== null) {
    return t(locale, "museum.onchain.releases.contentsIndex", {
      files: formatCount(indexFiles),
    });
  }
  if (texts === 0) {
    return t(locale, "museum.onchain.releases.contentsRecords", {
      records: formatCount(records),
    });
  }
  if (records === 0) {
    return t(locale, "museum.onchain.releases.contentsTexts", {
      texts: formatCount(texts),
    });
  }
  return t(locale, "museum.onchain.releases.contents", {
    records: formatCount(records),
    texts: formatCount(texts),
  });
}

function Releases({ view }: Readonly<{ view: OnchainMuseumView }>) {
  const { releases } = view.snapshot.registry;
  return (
    <section aria-labelledby="releases" className="tw-mb-12">
      <SectionHeading id="releases">
        {t(locale, "museum.onchain.releases.heading")}
      </SectionHeading>
      <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
        {t(locale, "museum.onchain.releases.intro")}
      </p>
      <ol className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-4 tw-p-0 lg:tw-grid-cols-2">
        {releases.map((release) => {
          const records = view.snapshot.records.filter(
            (record) => record.version.releaseId === release.releaseId
          );
          const texts = records.filter(
            (record) => record.recordType === "PUBLIC_DOCUMENT"
          ).length;
          const earlier = releases.find(
            (other) =>
              other.releaseId < release.releaseId &&
              other.manifestCid.toLowerCase() ===
                release.manifestCid.toLowerCase()
          );
          const commit = release.sourceCommit.slice(2);
          return (
            <li
              key={release.releaseId}
              className="tw-min-w-0 tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-p-5"
            >
              <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                {t(locale, "museum.onchain.releases.item", {
                  id: release.releaseId,
                })}
              </h3>
              <p className="tw-m-0 tw-mt-1 tw-text-base tw-text-iron-200">
                {releaseContents(
                  records.length - texts,
                  texts,
                  view.snapshot.media.index.releaseId === release.releaseId
                    ? view.snapshot.media.index.fileCount
                    : null
                )}
                {" · "}
                {release.isSealed
                  ? t(locale, "museum.onchain.releases.sealed", {
                      date: formatUtcDateTime(release.sealedAt),
                    })
                  : t(locale, "museum.onchain.releases.open")}
              </p>
              {earlier === undefined ? null : (
                <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {t(locale, "museum.onchain.releases.sameManifest", {
                    id: earlier.releaseId,
                  })}
                </p>
              )}
              <div className="tw-mt-4">
                <FactList
                  facts={[
                    {
                      label: t(locale, "museum.onchain.releases.manifest"),
                      value:
                        release.manifestCid === "0x" ? (
                          "-"
                        ) : (
                          <>
                            <CopyValue
                              value={cidToText(release.manifestCid)}
                              field={t(
                                locale,
                                "museum.onchain.releases.manifest"
                              )}
                              href={`https://media.6529.io/ipfs/${cidToText(release.manifestCid)}`}
                            />
                            <span className="tw-mt-1 tw-block tw-text-iron-400">
                              {t(
                                locale,
                                "museum.onchain.releases.manifestHelp"
                              )}
                            </span>
                          </>
                        ),
                    },
                    ...(release.rootCid === "0x"
                      ? []
                      : [
                          {
                            label: t(locale, "museum.onchain.releases.rootCid"),
                            value: (
                              <>
                                <CopyValue
                                  value={cidToText(release.rootCid)}
                                  field={t(
                                    locale,
                                    "museum.onchain.releases.rootCid"
                                  )}
                                  href={`https://media.6529.io/ipfs/${cidToText(release.rootCid)}`}
                                />
                                <span className="tw-mt-1 tw-block tw-text-iron-400">
                                  {t(
                                    locale,
                                    "museum.onchain.releases.rootCidHelp"
                                  )}
                                </span>
                              </>
                            ),
                          },
                        ]),
                    {
                      label: t(locale, "museum.onchain.releases.sourceCommit"),
                      value: (
                        <>
                          <a
                            href={`${MUSEUM_REPOSITORY}/commit/${commit}`}
                            rel="noreferrer"
                            className={TEXT_LINK}
                          >
                            <code className="tw-font-mono tw-text-[0.8125rem]">
                              {commit.slice(0, 12)}
                            </code>
                          </a>
                          <span className="tw-mt-1 tw-block tw-text-iron-400">
                            {t(
                              locale,
                              "museum.onchain.releases.sourceCommitHelp"
                            )}
                          </span>
                        </>
                      ),
                    },
                  ]}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default async function OnchainMuseumPage() {
  await connection();
  const state = await getOnchainMuseum();
  if (state.status !== "ready") return <OnchainUnavailable />;
  const { snapshot } = state;
  const view = onchainMuseumView(snapshot);
  const recordsKicker = t(locale, "museum.onchain.records.heading");
  const groups = [
    ...view.entityGroups.map((group) => ({
      key: group.key,
      anchor: group.anchor,
      heading: group.heading,
      layout: group.key === "WORK" ? ("cards" as const) : ("list" as const),
      // Works with a published image lead; the order is otherwise kept.
      items: group.records
        .map((record) => filterableItem(view, record))
        .sort(
          (left, right) =>
            Number(left.image === undefined) - Number(right.image === undefined)
        ),
    })),
    ...view.recordGroups.map((group) => ({
      key: group.key,
      anchor: group.anchor,
      heading: group.heading,
      kicker: recordsKicker,
      items: group.records.map((record) => filterableItem(view, record)),
    })),
  ];
  const leadGroups = view.entityGroups.slice(0, 4);

  return (
    <>
      <PageHeading
        eyebrow={t(locale, "museum.onchain.eyebrow")}
        title={t(locale, "museum.onchain.heading")}
        intro={
          <>
            <p className="tw-m-0">{t(locale, "museum.onchain.intro")}</p>
            <p className="tw-m-0 tw-mt-2 tw-text-iron-200">
              {t(locale, "museum.onchain.summaryLine", {
                verified: formatCount(snapshot.counts.verified),
                total: formatCount(snapshot.records.length),
              })}{" "}
              <a href="#verification" className={TEXT_LINK}>
                {t(locale, "museum.onchain.summaryLink")}
              </a>
            </p>
          </>
        }
      />
      <JumpNav
        links={[
          ...leadGroups.map((group) => ({
            href: `#${group.anchor}`,
            label: group.heading,
          })),
          {
            href: `#${view.recordGroups[0]?.anchor ?? "verification"}`,
            label: t(locale, "museum.onchain.jump.records"),
          },
          { href: "#texts", label: t(locale, "museum.onchain.jump.texts") },
          {
            href: "#verification",
            label: t(locale, "museum.onchain.jump.verification"),
          },
        ]}
      />

      <section aria-labelledby="collection" className="tw-mb-8">
        <h2 id="collection" className="tw-sr-only">
          {t(locale, "museum.onchain.collection.heading")}
        </h2>
        <FilterableGroups groups={groups} copy={filterCopy()} />
        <p className="tw-m-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "museum.onchain.relations.summary", {
            count: formatCount(view.relationCount),
          })}
        </p>
      </section>

      <section
        aria-labelledby="texts"
        className="tw-mb-12 tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-p-5 sm:tw-p-6"
      >
        <SectionHeading id="texts">
          {t(locale, "museum.onchain.texts.heading")}
        </SectionHeading>
        <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
          {t(locale, "museum.onchain.texts.summary", {
            count: formatCount(view.texts.length),
          })}{" "}
          <Link href={ONCHAIN_MUSEUM_TEXTS_HREF} className={TEXT_LINK}>
            {t(locale, "museum.onchain.texts.open")}
          </Link>
        </p>
      </section>

      <Verification snapshot={snapshot} />
      <Releases view={view} />
    </>
  );
}
