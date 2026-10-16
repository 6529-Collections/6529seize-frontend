import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  VerificationDay,
  VerificationImplementation,
} from "@/lib/tdh/verification/schema";
import TdhHeading from "../../shared/TdhHeading";
import TdhCopyButton from "../../shared/TdhCopyButton";
import TdhSource from "../../shared/TdhSource";
import TdhStatusPill from "../../shared/TdhStatusPill";
import { REGISTRY_HASH } from "../../shared/tdhRules";
import { TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import {
  arweaveFileUrl,
  arweaveTransactionUrl,
  etherscanBlockUrl,
} from "./verificationLinks";
import {
  formatInteger,
  middleTruncate,
  shortCommit,
} from "./verificationFormat";

const DT =
  "tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const DD = "tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200";

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

function Item({
  label,
  children,
  wide = false,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly wide?: boolean;
}) {
  return (
    <div className={`tw-min-w-0 ${wide ? "sm:tw-col-span-2" : ""}`}>
      <dt className={DT}>{label}</dt>
      <dd className={DD}>{children}</dd>
    </div>
  );
}

/** A commit with the repository it belongs to: "validator @ db72daa". */
export function CommitLine({
  locale,
  program,
  repository,
  commit,
}: {
  readonly locale: SupportedLocale;
  readonly program: string;
  readonly repository: string;
  readonly commit: string;
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
      <span className="tw-w-20 tw-shrink-0 tw-text-xs tw-text-iron-400">
        {label}
      </span>
      <Hash
        locale={locale}
        value={id}
        name={t(locale, "network.tdh.verify.provenance.liveSource")}
        keep={6}
      />
      <span className="tw-inline-flex tw-gap-3 tw-text-xs">
        <a
          href={arweaveTransactionUrl(id)}
          className={TDH_LINK}
          rel="noopener noreferrer"
          target="_blank"
          aria-label={t(locale, "network.tdh.verify.provenance.txLink", { id })}
        >
          {t(locale, "network.tdh.verify.provenance.tx")}
        </a>
        <a
          href={arweaveFileUrl(id)}
          className={TDH_LINK}
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
        />
      )}
      {python?.commit && (
        <CommitLine
          locale={locale}
          program={t(locale, "network.tdh.verify.side.python")}
          repository="6529chain"
          commit={python.commit}
        />
      )}
      <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "network.tdh.verify.provenance.commitsNote")}
      </span>
    </>
  );
}

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
  indexUrl,
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay | null;
  readonly dayUrl: string | null;
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
        className="tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      />
      <div className={`${TDH_CARD} tw-mt-4 tw-p-5 sm:tw-p-6`}>
        <dl className="tw-m-0 tw-grid tw-items-start tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
          <Item label={t(locale, "network.tdh.verify.provenance.dataSource")}>
            {t(locale, "network.tdh.verify.provenance.remote")}
          </Item>
          {day && (
            <Item label={t(locale, "network.tdh.verify.provenance.snapshot")}>
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
                <span className="tw-block">
                  <Hash
                    locale={locale}
                    value={day.cutoffBlockHash}
                    name={t(locale, "network.tdh.verify.provenance.snapshot")}
                  />
                </span>
              )}
            </Item>
          )}
          {day && (
            <Item label={t(locale, "network.tdh.verify.provenance.history")}>
              <TdhStatusPill
                pill={day.mode === "checked" ? "checked" : "unchecked"}
                locale={locale}
                size="sm"
              />
            </Item>
          )}
          <Item label={t(locale, "network.tdh.verify.provenance.rule")}>
            {day?.ruleVersion
              ? t(locale, "network.tdh.verify.provenance.ruleFromFile", {
                  version: day.ruleVersion,
                })
              : t(locale, "network.tdh.verify.provenance.ruleFromSpec")}
          </Item>
          <Item label={t(locale, "network.tdh.verify.provenance.registry")}>
            <Hash
              locale={locale}
              value={day?.registryHash ?? REGISTRY_HASH}
              name={t(locale, "network.tdh.verify.provenance.registry")}
            />
            {!day?.registryHash && (
              <span className="tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                {t(locale, "network.tdh.verify.provenance.registryFromSpec")}
                <TdhSource refs={["P26 §10"]} locale={locale} />
              </span>
            )}
          </Item>
          {(rust?.commit ?? python?.commit) && (
            <Item label={t(locale, "network.tdh.verify.provenance.commits")}>
              <Commits locale={locale} rust={rust} python={python} />
            </Item>
          )}
          {day && (
            <Item
              label={t(locale, "network.tdh.verify.provenance.liveSource")}
              wide
            >
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
                  {live?.sha256 && (
                    <span className="tw-block tw-text-xs tw-text-iron-400">
                      {t(locale, "network.tdh.verify.provenance.liveSha", {
                        hash: middleTruncate(live.sha256, 6),
                      })}
                    </span>
                  )}
                  <span className="tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                    {t(locale, "network.tdh.verify.provenance.signed")}
                  </span>
                </span>
              )}
            </Item>
          )}
        </dl>
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
        </div>
      </div>
    </section>
  );
}
