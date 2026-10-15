import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhCopyButton from "../../shared/TdhCopyButton";
import TdhStatusPill from "../../shared/TdhStatusPill";
import { TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import { formatInteger, middleTruncate } from "./verificationFormat";

export const TDH_V1_REGISTRY_HASH =
  "0x74b4a8f96e3f1fbc3f44167bb42f0a18effb7a0f49d12bc8b88cdb3784c663d3";

const DT =
  "tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500";
const DD = "tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200";

export default function VerificationProvenance({
  locale,
  isSample,
  cutoffBlock,
  mode,
  liveSource,
  dayUrl,
  indexUrl,
}: {
  readonly locale: SupportedLocale;
  readonly isSample: boolean;
  readonly cutoffBlock: number | null;
  readonly mode: "unchecked-history" | "checked" | null;
  readonly liveSource: string | null;
  readonly dayUrl: string | null;
  readonly indexUrl: string | null;
}) {
  const uploadId = liveSource?.replace(/^arweave:/, "") ?? null;
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
        <dl className="tw-m-0 tw-grid tw-gap-5 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
          <div>
            <dt className={DT}>
              {t(locale, "network.tdh.verify.provenance.dataSource")}
            </dt>
            <dd className={DD}>
              {isSample ? (
                <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-2">
                  <TdhStatusPill pill="sample" locale={locale} size="sm" />
                  {t(locale, "network.tdh.verify.provenance.sample")}
                </span>
              ) : (
                t(locale, "network.tdh.verify.provenance.remote")
              )}
            </dd>
          </div>
          <div>
            <dt className={DT}>
              {t(locale, "network.tdh.verify.provenance.rule")}
            </dt>
            <dd className={DD}>
              {t(locale, "network.tdh.verify.provenance.ruleValue")}
            </dd>
          </div>
          <div>
            <dt className={DT}>
              {t(locale, "network.tdh.verify.provenance.registry")}
            </dt>
            <dd className={`${DD} tw-flex tw-items-center tw-gap-1`}>
              <code
                className="tw-font-mono tw-text-xs tw-text-iron-200"
                title={TDH_V1_REGISTRY_HASH}
              >
                {middleTruncate(TDH_V1_REGISTRY_HASH, 8)}
              </code>
              <TdhCopyButton
                value={TDH_V1_REGISTRY_HASH}
                label={t(locale, "network.tdh.shared.copyNamed", {
                  name: `${t(locale, "network.tdh.verify.provenance.registry")} ${TDH_V1_REGISTRY_HASH}`,
                })}
                copiedLabel={t(locale, "network.tdh.shared.copied")}
                failedLabel={t(locale, "network.tdh.shared.copyFailed")}
              />
            </dd>
          </div>
          {cutoffBlock !== null && (
            <div>
              <dt className={DT}>
                {t(locale, "network.tdh.verify.provenance.snapshot")}
              </dt>
              <dd className={`${DD} tw-tabular-nums`}>
                {formatInteger(locale, cutoffBlock)}
              </dd>
            </div>
          )}
          {mode && (
            <div>
              <dt className={DT}>
                {t(locale, "network.tdh.verify.provenance.history")}
              </dt>
              <dd className={DD}>
                <TdhStatusPill
                  pill={mode === "checked" ? "checked" : "unchecked"}
                  locale={locale}
                  size="sm"
                />
              </dd>
            </div>
          )}
          <div>
            <dt className={DT}>
              {t(locale, "network.tdh.verify.provenance.liveSource")}
            </dt>
            <dd className={DD}>
              {t(locale, "network.tdh.verify.provenance.liveSourceValue")}
              {uploadId === null ? (
                <span className="tw-block tw-text-xs tw-text-iron-500">
                  {t(locale, "network.tdh.verify.provenance.liveSourceMissing")}
                </span>
              ) : (
                <span className="tw-flex tw-items-center tw-gap-1">
                  <code
                    className="tw-font-mono tw-text-xs tw-text-iron-300"
                    title={uploadId}
                  >
                    {middleTruncate(uploadId, 6)}
                  </code>
                  <TdhCopyButton
                    value={uploadId}
                    label={t(locale, "network.tdh.shared.copyNamed", {
                      name: `${t(locale, "network.tdh.verify.provenance.liveSource")} ${uploadId}`,
                    })}
                    copiedLabel={t(locale, "network.tdh.shared.copied")}
                    failedLabel={t(locale, "network.tdh.shared.copyFailed")}
                  />
                </span>
              )}
            </dd>
          </div>
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
                  className={`${TDH_LINK} tw-inline-flex tw-items-center tw-gap-1.5`}
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
                  {t(locale, "network.tdh.verify.provenance.downloadDay")}
                </a>
              )}
              {indexUrl && (
                <a
                  href={indexUrl}
                  className={`${TDH_LINK} tw-inline-flex tw-items-center tw-gap-1.5`}
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
