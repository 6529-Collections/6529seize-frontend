import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  SolidityGenerationWarning,
  SolidityWarningSummary,
} from "@/lib/public-review/solidityReferenceTypes";

const CARD_CLASSES =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5";

function WarningCounts({
  counts,
  heading,
}: {
  readonly counts: Readonly<Record<string, number>>;
  readonly heading: string;
}) {
  return (
    <div>
      <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        {heading}
      </h3>
      <dl className="tw-mb-0 tw-mt-3 tw-grid tw-gap-2">
        {Object.entries(counts).map(([name, count]) => (
          <div key={name} className="tw-rounded-lg tw-bg-iron-900 tw-p-3">
            <dt className="tw-break-all tw-font-mono tw-text-xs tw-text-amber-200">
              {name.replaceAll("_", " ")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-font-mono tw-text-sm tw-text-white">
              {formatInteger(DEFAULT_LOCALE, count)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WarningRecords({
  warnings,
}: {
  readonly warnings: readonly SolidityGenerationWarning[];
}) {
  if (warnings.length === 0) {
    return null;
  }
  return (
    <details className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-3">
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
        {t(DEFAULT_LOCALE, "publicReview.reference.warningRecords")} (
        {formatInteger(DEFAULT_LOCALE, warnings.length)})
      </summary>
      <ul className="tw-mb-0 tw-mt-3 tw-list-none tw-space-y-2 tw-p-0">
        {warnings.map((warning) => (
          <li
            key={`${warning.code}:${warning.category}:${warning.severity}:${warning.definitionId}:${warning.declarationId ?? ""}`}
            className="tw-rounded-lg tw-bg-iron-900 tw-p-3"
          >
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              <code className="tw-break-all tw-text-xs tw-text-amber-200">
                {warning.code}
              </code>
              <span className="tw-rounded-full tw-bg-iron-950 tw-px-2 tw-py-0.5 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300">
                {warning.severity}
              </span>
              <span className="tw-rounded-full tw-bg-iron-950 tw-px-2 tw-py-0.5 tw-text-[0.7rem] tw-text-iron-400">
                {warning.category}
              </span>
            </div>
            <code className="tw-mt-2 tw-block tw-break-all tw-text-xs tw-leading-5 tw-text-iron-400">
              {warning.declarationId ?? warning.definitionId}
            </code>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function SolidityWarnings({
  summary,
  warnings,
}: {
  readonly summary: SolidityWarningSummary;
  readonly warnings: readonly SolidityGenerationWarning[];
}) {
  return (
    <section
      aria-labelledby="solidity-warning-summary"
      className={CARD_CLASSES}
    >
      <h2
        id="solidity-warning-summary"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.warningSummary")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.reference.warningDescription")}
      </p>
      {summary.totalCount === 0 ? (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-emerald-200">
          {t(DEFAULT_LOCALE, "publicReview.reference.noWarnings")}
        </p>
      ) : (
        <>
          <div className="tw-mt-5 tw-grid tw-gap-5 lg:tw-grid-cols-2">
            <WarningCounts
              counts={summary.byCategory}
              heading={t(
                DEFAULT_LOCALE,
                "publicReview.reference.warningCategories"
              )}
            />
            <WarningCounts
              counts={summary.byCode}
              heading={t(DEFAULT_LOCALE, "publicReview.reference.warningCodes")}
            />
          </div>
          <WarningRecords warnings={warnings} />
        </>
      )}
    </section>
  );
}
