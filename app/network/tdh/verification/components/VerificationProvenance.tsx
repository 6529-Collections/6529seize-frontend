import { ArrowDownTrayIcon, RssIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  VerificationDay,
  VerificationImplementation,
} from "@/lib/tdh/verification/schema";
import CaseSafe from "../../shared/CaseSafe";
import TdhHeading from "../../shared/TdhHeading";
import TdhCopyButton from "../../shared/TdhCopyButton";
import TdhSource from "../../shared/TdhSource";
import TdhStatusPill from "../../shared/TdhStatusPill";
import TdhDisclosure from "../../shared/TdhDisclosure";
import { rustCoreSpec } from "../../shared/tdhFacts";
import { REGISTRY_HASH } from "../../shared/tdhRules";
import { TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import {
  arweaveFileUrl,
  arweaveTransactionUrl,
  etherscanBlockUrl,
} from "./verificationLinks";
import {
  formatCycleDate,
  formatInteger,
  middleTruncate,
  shortCommit,
} from "./verificationFormat";

const DT =
  "tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const DD = "tw-m-0 tw-min-w-0 tw-text-sm tw-leading-6 tw-text-iron-200";

function Hash({
  locale,
  value,
  name,
  keep = 8,
}: {
  readonly locale: SupportedLocale;
  readonly value: string;
  readonly name: string;
  readonly keep?: number;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap tw-align-middle">
      <code
        className="tw-font-mono tw-text-xs tw-leading-6 tw-text-iron-200"
        title={value}
      >
        {middleTruncate(value, keep)}
      </code>
      <TdhCopyButton
        value={value}
        label={t(locale, "network.tdh.shared.copyNamed", {
          name: `${name} ${value}`,
        })}
        copiedLabel={t(locale, "network.tdh.shared.copied")}
        failedLabel={t(locale, "network.tdh.shared.copyFailed")}
      />
    </span>
  );
}

function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-x-6 tw-gap-y-1 tw-py-3 sm:tw-grid-cols-[10rem_minmax(0,1fr)] sm:tw-items-baseline">
      <dt className={DT}>
        <CaseSafe text={label} />
      </dt>
      <dd className={DD}>{children}</dd>
    </div>
  );
}

/** A commit with the repository it belongs to: "validator @ db72daa". */
function CommitLine({
  locale,
  program,
  repository,
  commit,
  follows,
}: {
  readonly locale: SupportedLocale;
  readonly program: string;
  readonly repository: string;
  readonly commit: string;
  /** The P26 commit the code computes, when known. */
  readonly follows: string | null;
}) {
  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
      <span className="tw-text-iron-300">{program}</span>
      <span className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
        <code className="tw-font-mono tw-text-xs tw-text-iron-200">
          {repository}@{shortCommit(commit)}
        </code>
        <TdhCopyButton
          value={commit}
          label={t(locale, "network.tdh.shared.copyNamed", {
            name: `${repository} ${commit}`,
          })}
          copiedLabel={t(locale, "network.tdh.shared.copied")}
          failedLabel={t(locale, "network.tdh.shared.copyFailed")}
        />
      </span>
      {follows && (
        <span className="tw-text-iron-400">
          {t(locale, "network.tdh.verify.provenance.follows", {
            commit: follows,
          })}
        </span>
      )}
    </span>
  );
}

function UploadLine({
  locale,
  label,
  source,
}: {
  readonly locale: SupportedLocale;
  readonly label: string;
  readonly source: string;
}) {
  const id = source.replace(/^arweave:/, "");
  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-0.5">
      <span className="tw-w-20 tw-shrink-0 tw-text-sm tw-text-iron-400">
        {label}
      </span>
      <Hash
        locale={locale}
        value={id}
        name={t(locale, "network.tdh.verify.provenance.liveSource")}
        keep={6}
      />
      <span className="tw-inline-flex tw-gap-3 tw-text-sm">
        <a
          href={arweaveTransactionUrl(id)}
          className={`${TDH_LINK} tw-inline-flex tw-min-h-6 tw-min-w-6 tw-items-center`}
          rel="noopener noreferrer"
          target="_blank"
          aria-label={t(locale, "network.tdh.verify.provenance.txLink", { id })}
        >
          {t(locale, "network.tdh.verify.provenance.tx")}
        </a>
        <a
          href={arweaveFileUrl(id)}
          className={`${TDH_LINK} tw-inline-flex tw-min-h-6 tw-min-w-6 tw-items-center`}
          rel="noopener noreferrer"
          target="_blank"
          aria-label={t(locale, "network.tdh.verify.side.uploadLink", { id })}
        >
          {t(locale, "network.tdh.verify.provenance.file")}
        </a>
      </span>
    </span>
  );
}

function Commits({
  locale,
  rust,
  python,
}: {
  readonly locale: SupportedLocale;
  readonly rust: VerificationImplementation | null;
  readonly python: VerificationImplementation | null;
}) {
  return (
    <>
      {rust?.commit && (
        <CommitLine
          locale={locale}
          program={t(locale, "network.tdh.verify.side.rust")}
          repository="validator"
          commit={rust.commit}
          follows={rustCoreSpec(rust.commit)}
        />
      )}
      {python?.commit && (
        <CommitLine
          locale={locale}
          program={t(locale, "network.tdh.verify.side.python")}
          repository="6529chain"
          commit={python.commit}
          follows={shortCommit(python.commit)}
        />
      )}
    </>
  );
}

/** The day before a day, as its own page shows it. */
export interface PreviousDay {
  readonly cycleDay: number;
  readonly date: string;
  readonly sha256: string | null;
}

/**
 * The first day of the scheduled daily runs (D132): the feed's days before it
 * were computed together on October 15, 2026.
 */
const SCHEDULED_FROM = "2026-10-16";

/**
 * What the day's result rests on (P26 §4.2, §9): where the data comes from,
 * rule version, registry hash, snapshot block, history mode, code versions
 * and 6529.io's signed files. Values come from the day's file; where it does
 * not state one, the page says so and shows the specification's value.
 */
export default function VerificationProvenance({
  locale,
  day,
  dayUrl,
  daySha256 = null,
  previousDay = null,
  indexUrl,
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay | null;
  readonly dayUrl: string | null;
  /** The SHA-256 of the day file's bytes as the page read them. */
  readonly daySha256?: string | null;
  /** The day before, with its own file's SHA-256, to check days as a chain. */
  readonly previousDay?: PreviousDay | null;
  readonly indexUrl: string;
}) {
  const rust = day?.implementations.rust ?? null;
  const python = day?.implementations.python ?? null;
  const live = day?.implementations.live ?? null;
  const identityUpload = live?.sources?.identity ?? live?.source ?? null;
  const walletUpload = live?.sources?.wallet ?? null;
  return (
    <section
      id="provenance"
      aria-labelledby="provenance-heading"
      className="tw-mt-12 tw-scroll-mt-24"
    >
      <TdhHeading
        id="provenance"
        title={t(locale, "network.tdh.verify.provenance.heading")}
        locale={locale}
        className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 min-[360px]:tw-text-2xl"
      />
      <div className={`${TDH_CARD} tw-mt-4 tw-p-5 sm:tw-p-6`}>
        {/* Where the data comes from, across the card in two lines; then
            the facts as one column of label and value rows, each value a
            line or two; what each means waits in one disclosure. */}
        <p className={`${DT} tw-m-0`}>
          {t(locale, "network.tdh.verify.provenance.dataSource")}
        </p>
        {/* The feed's host name is one long word: it may break anywhere. */}
        <p className="tw-m-0 tw-mt-1 tw-max-w-[38em] tw-text-sm tw-leading-6 tw-text-iron-200 [overflow-wrap:anywhere]">
          {t(locale, "network.tdh.verify.provenance.remote")}
        </p>
        <dl className="tw-m-0 tw-mt-5 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-border-0 tw-border-y tw-border-solid tw-border-white/[0.06]">
          {day && (
            <Row label={t(locale, "network.tdh.verify.provenance.snapshot")}>
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
                <a
                  href={etherscanBlockUrl(day.cutoffBlock)}
                  className={`${TDH_LINK} tw-tabular-nums`}
                  rel="noopener noreferrer"
                  target="_blank"
                  aria-label={t(
                    locale,
                    "network.tdh.verify.provenance.explorer",
                    { block: formatInteger(locale, day.cutoffBlock) }
                  )}
                >
                  {formatInteger(locale, day.cutoffBlock)}
                </a>
                {day.cutoffBlockHash && (
                  <Hash
                    locale={locale}
                    value={day.cutoffBlockHash}
                    name={t(locale, "network.tdh.verify.provenance.snapshot")}
                  />
                )}
              </span>
            </Row>
          )}
          {day && (
            <Row label={t(locale, "network.tdh.verify.provenance.history")}>
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
                <TdhStatusPill
                  pill={day.mode === "checked" ? "checked" : "unchecked"}
                  locale={locale}
                  size="sm"
                />
                <span className="tw-text-iron-300">
                  {t(
                    locale,
                    day.mode === "checked"
                      ? "network.tdh.verify.mode.checkedShort"
                      : "network.tdh.verify.mode.uncheckedShort"
                  )}
                </span>
              </span>
            </Row>
          )}
          <Row label={t(locale, "network.tdh.verify.provenance.rule")}>
            {day?.ruleVersion
              ? t(locale, "network.tdh.verify.provenance.ruleFromFile", {
                  version: day.ruleVersion,
                })
              : t(locale, "network.tdh.verify.provenance.ruleFromSpec")}
          </Row>
          <Row label={t(locale, "network.tdh.verify.provenance.registry")}>
            <Hash
              locale={locale}
              value={day?.registryHash ?? REGISTRY_HASH}
              name={t(locale, "network.tdh.verify.provenance.registry")}
            />
          </Row>
          {(rust?.commit ?? python?.commit) && (
            <Row label={t(locale, "network.tdh.verify.provenance.commits")}>
              <Commits locale={locale} rust={rust} python={python} />
            </Row>
          )}
          {day && (
            <Row label={t(locale, "network.tdh.verify.provenance.liveSource")}>
              {identityUpload === null ? (
                <span className="tw-text-iron-400">
                  {t(locale, "network.tdh.verify.provenance.liveSourceMissing")}
                </span>
              ) : (
                <span className="tw-flex tw-flex-col tw-gap-1">
                  <UploadLine
                    locale={locale}
                    label={t(
                      locale,
                      "network.tdh.verify.provenance.identityFile"
                    )}
                    source={identityUpload}
                  />
                  {walletUpload && walletUpload !== identityUpload && (
                    <UploadLine
                      locale={locale}
                      label={t(
                        locale,
                        "network.tdh.verify.provenance.walletFile"
                      )}
                      source={walletUpload}
                    />
                  )}
                </span>
              )}
            </Row>
          )}
          {previousDay && (
            <Row label={t(locale, "network.tdh.verify.provenance.previous")}>
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
                <Link
                  href={`/network/tdh/verification/${previousDay.cycleDay}`}
                  className={TDH_LINK}
                >
                  {formatCycleDate(locale, previousDay.date)}
                </Link>
                {previousDay.sha256 && (
                  <Hash
                    locale={locale}
                    value={previousDay.sha256}
                    name={t(
                      locale,
                      "network.tdh.verify.provenance.previousSha"
                    )}
                  />
                )}
              </span>
            </Row>
          )}
        </dl>
        <TdhDisclosure
          className="tw-mt-3"
          summary={t(locale, "network.tdh.verify.provenance.notes")}
        >
          <ul className="tw-m-0 tw-max-w-[38em] tw-list-disc tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-500">
            {day && (
              <li>
                {t(
                  locale,
                  day.mode === "checked"
                    ? "network.tdh.verify.mode.checked"
                    : "network.tdh.verify.mode.unchecked"
                )}
                <TdhSource refs={["D118", "P53 §11"]} locale={locale} />
              </li>
            )}
            {python?.commit && (
              <li>
                {t(locale, "network.tdh.verify.provenance.p26Run", {
                  commit: python.commit.slice(0, 7),
                })}
              </li>
            )}
            {!day?.registryHash && (
              <li>
                {t(locale, "network.tdh.verify.provenance.registryFromSpec")}
                <TdhSource refs={["P26 §10"]} locale={locale} />
              </li>
            )}
            {(rust?.commit ?? python?.commit) && (
              <li>{t(locale, "network.tdh.verify.provenance.commitsNote")}</li>
            )}
            {day && day.date < SCHEDULED_FROM && (
              <li>{t(locale, "network.tdh.verify.provenance.manualRun")}</li>
            )}
            {identityUpload !== null && (
              <li>
                {t(locale, "network.tdh.verify.provenance.signed")}
                {live?.sha256 &&
                  ` ${t(locale, "network.tdh.verify.provenance.liveSha", {
                    hash: middleTruncate(live.sha256, 6),
                  })}`}
              </li>
            )}
            {previousDay && (
              <li>{t(locale, "network.tdh.verify.provenance.previousNote")}</li>
            )}
          </ul>
        </TdhDisclosure>
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 tw-text-sm">
          {dayUrl && (
            <a
              href={dayUrl}
              className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5`}
            >
              <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
              {t(locale, "network.tdh.verify.provenance.downloadDay")}
            </a>
          )}
          <a
            href={indexUrl}
            className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5`}
          >
            <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
            {t(locale, "network.tdh.verify.provenance.downloadIndex")}
          </a>
          <a
            href="/network/tdh/verification.rss"
            className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5`}
          >
            <RssIcon aria-hidden="true" className="tw-size-4" />
            {t(locale, "network.tdh.verify.provenance.rss")}
          </a>
          {daySha256 && (
            <p className="tw-m-0 tw-basis-full tw-text-sm tw-leading-5 tw-text-iron-400">
              {t(locale, "network.tdh.verify.provenance.daySha")}
              {/* Only the hash may break, anywhere; the words never. */}
              <code className="tw-mt-0.5 tw-block tw-break-all tw-font-mono tw-text-iron-300">
                {daySha256}
              </code>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
