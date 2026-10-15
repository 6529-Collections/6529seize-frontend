import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { VerificationDay } from "@/lib/tdh/verification/schema";
import TdhCopyButton from "../../shared/TdhCopyButton";
import TdhStatusPill from "../../shared/TdhStatusPill";
import { REGISTRY_HASH } from "../../shared/tdhRules";
import { TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import { formatInteger, middleTruncate } from "./verificationFormat";

const DT =
  "tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const DD = "tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200";

export function etherscanBlockUrl(block: number): string {
  return `https://etherscan.io/block/${block}`;
}

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
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-align-middle">
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
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className={DT}>{label}</dt>
      <dd className={DD}>{children}</dd>
    </div>
  );
}

/**
 * What the day's result rests on (P26 §4.2, §9): rule version, registry
 * hash, snapshot block, history mode, netting, code versions and 6529.io's
 * files. Values come from the day's file; where it does not state one, the
 * page says so and shows the specification's value.
 */
export default function VerificationProvenance({
  locale,
  isSample,
  day,
  dayUrl,
  indexUrl,
}: {
  readonly locale: SupportedLocale;
  readonly isSample: boolean;
  readonly day: VerificationDay | null;
  readonly dayUrl: string | null;
  readonly indexUrl: string | null;
}) {
  const rust = day?.implementations.rust ?? null;
  const python = day?.implementations.python ?? null;
  const live = day?.implementations.live ?? null;
  const identityUpload = live?.sources?.identity ?? live?.source ?? null;
  const walletUpload = live?.sources?.wallet ?? null;
  const netting = rust?.transactionNetting ?? null;
  return (
    <section
      aria-labelledby="tdh-verify-provenance-heading"
      className="tw-mt-10"
    >
      <h2
        id="tdh-verify-provenance-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "network.tdh.verify.provenance.heading")}
      </h2>
      <div className={`${TDH_CARD} tw-mt-4 tw-p-5 sm:tw-p-6`}>
        <dl className="tw-m-0 tw-grid tw-items-start tw-gap-5 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
          <Item label={t(locale, "network.tdh.verify.provenance.dataSource")}>
            {isSample ? (
              <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-2">
                <TdhStatusPill pill="sample" locale={locale} size="sm" />
                {t(locale, "network.tdh.verify.provenance.sample")}
              </span>
            ) : (
              t(locale, "network.tdh.verify.provenance.remote")
            )}
          </Item>
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
              </span>
            )}
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
                  {
                    block: formatInteger(locale, day.cutoffBlock),
                  }
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
          {day && netting !== null && (
            <Item label={t(locale, "network.tdh.verify.provenance.netting")}>
              {netting ? (
                t(locale, "network.tdh.verify.side.nettingOn")
              ) : (
                <span className="tw-text-amber-200">
                  {t(locale, "network.tdh.verify.side.nettingOff")}
                </span>
              )}
            </Item>
          )}
          {(rust?.commit ?? python?.commit) && (
            <Item label={t(locale, "network.tdh.verify.provenance.commits")}>
              {rust?.commit && (
                <span className="tw-block">
                  {t(locale, "network.tdh.verify.provenance.commitRust", {
                    commit: rust.commit.slice(0, 7),
                  })}
                </span>
              )}
              {python?.commit && (
                <span className="tw-block">
                  {t(locale, "network.tdh.verify.provenance.commitPython", {
                    commit: python.commit.slice(0, 7),
                  })}
                </span>
              )}
            </Item>
          )}
          {day && (
            <Item label={t(locale, "network.tdh.verify.provenance.liveSource")}>
              {identityUpload === null ? (
                <span className="tw-text-iron-400">
                  {t(locale, "network.tdh.verify.provenance.liveSourceMissing")}
                </span>
              ) : (
                <>
                  <span className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-w-14 tw-text-xs tw-text-iron-400">
                      {t(locale, "network.tdh.verify.provenance.identityFile")}
                    </span>
                    <Hash
                      locale={locale}
                      value={identityUpload.replace(/^arweave:/, "")}
                      name={t(
                        locale,
                        "network.tdh.verify.provenance.liveSource"
                      )}
                      keep={6}
                    />
                  </span>
                  {walletUpload && walletUpload !== identityUpload && (
                    <span className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-w-14 tw-text-xs tw-text-iron-400">
                        {t(locale, "network.tdh.verify.provenance.walletFile")}
                      </span>
                      <Hash
                        locale={locale}
                        value={walletUpload.replace(/^arweave:/, "")}
                        name={t(
                          locale,
                          "network.tdh.verify.provenance.liveSource"
                        )}
                        keep={6}
                      />
                    </span>
                  )}
                  {live?.sha256 && (
                    <span className="tw-block tw-text-xs tw-text-iron-400">
                      {t(locale, "network.tdh.verify.provenance.liveSha", {
                        hash: middleTruncate(live.sha256, 6),
                      })}
                    </span>
                  )}
                </>
              )}
            </Item>
          )}
        </dl>
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 tw-text-sm">
          {dayUrl === null && indexUrl === null ? (
            <p className="tw-m-0 tw-text-iron-400">
              {t(locale, "network.tdh.verify.provenance.noDownload")}
            </p>
          ) : (
            <>
              {dayUrl && (
                <a
                  href={dayUrl}
                  className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5`}
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
                  {t(locale, "network.tdh.verify.provenance.downloadDay")}
                </a>
              )}
              {indexUrl && (
                <a
                  href={indexUrl}
                  className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5`}
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
                  {t(locale, "network.tdh.verify.provenance.downloadIndex")}
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
