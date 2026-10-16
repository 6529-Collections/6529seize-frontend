import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhCopyButton from "../shared/TdhCopyButton";
import TdhDisclosure from "../shared/TdhDisclosure";
import { TDH_CARD } from "../shared/tdhStyles";
import { middleTruncate } from "../verification/components/verificationFormat";
import { VECTOR_SET } from "./vectors";

const KEYS = [
  { key: "params", normative: true },
  { key: "cycle", normative: true },
  { key: "transfers", normative: true },
  { key: "consolidation_events", normative: true },
  { key: "raw_logs", normative: true },
  { key: "expected", normative: true },
  { key: "expected_invalid", normative: true },
  { key: "legacy_expected", normative: false },
  { key: "effective_time_variant", normative: false },
] as const;

/**
 * For engineers writing a vector runner: which blocks of a vector file are
 * normative, what the rest mean, and where the set is pinned.
 */
export default function VectorFormat({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <div className={`${TDH_CARD} tw-p-4 sm:tw-p-5`}>
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
          {t(locale, "network.tdh.impl.format.pin", {
            commit: VECTOR_SET.specCommit,
            path: VECTOR_SET.path,
          })}
        </p>
        <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1 tw-whitespace-nowrap">
          <code className="tw-font-mono tw-text-xs tw-text-iron-200">
            {t(locale, "network.tdh.impl.format.tree", {
              tree: middleTruncate(VECTOR_SET.tree, 8),
            })}
          </code>
          <TdhCopyButton
            value={VECTOR_SET.tree}
            label={t(locale, "network.tdh.shared.copyNamed", {
              name: `git tree ${VECTOR_SET.tree}`,
            })}
            copiedLabel={t(locale, "network.tdh.shared.copied")}
            failedLabel={t(locale, "network.tdh.shared.copyFailed")}
          />
        </span>
      </div>
      <TdhDisclosure
        className="tw-mt-2"
        tone="strong"
        summary={t(locale, "network.tdh.impl.format.title")}
      >
        <div className="tw-pb-2 tw-pl-6">
          <dl className="tw-m-0 tw-grid tw-gap-x-6 tw-gap-y-3 md:tw-grid-cols-2">
            {KEYS.map(({ key, normative }) => (
              <div key={key} className="tw-min-w-0">
                <dt className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                  <code className="tw-font-mono tw-text-[13px] tw-text-iron-50">
                    {key}
                  </code>
                  <span
                    className={`tw-rounded-full tw-px-2 tw-py-px tw-text-xs ${
                      normative
                        ? "tw-bg-primary-500/15 tw-text-primary-300"
                        : "tw-bg-iron-800 tw-text-iron-400"
                    }`}
                  >
                    {t(
                      locale,
                      normative
                        ? "network.tdh.impl.format.normative"
                        : "network.tdh.impl.format.informative"
                    )}
                  </span>
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {t(
                    locale,
                    `network.tdh.impl.format.key.${key}` as MessageKey
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="tw-m-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "network.tdh.impl.format.records")}
          </p>
        </div>
      </TdhDisclosure>
    </div>
  );
}
