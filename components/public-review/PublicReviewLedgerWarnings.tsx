import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { PublicReviewLedgerWarning } from "@/services/api/public-review/types";

export function PublicReviewLedgerWarnings({
  className = "tw-mt-5",
  locale,
  warnings,
}: {
  readonly className?: string | undefined;
  readonly locale: SupportedLocale;
  readonly warnings: readonly PublicReviewLedgerWarning[];
}) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div
      className={`${className} tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/40 tw-bg-amber-950/20 tw-p-3 tw-text-amber-100`}
    >
      <p className="tw-m-0 tw-text-sm">
        {t(locale, "publicReview.ledger.warning", {
          count: formatInteger(locale, warnings.length),
        })}
      </p>
      <details className="tw-mt-2">
        <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-xs tw-font-semibold tw-text-amber-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
          {t(locale, "publicReview.ledger.warningDiagnostics")}
        </summary>
        <ul className="tw-mb-0 tw-mt-1 tw-space-y-1 tw-pl-5 tw-text-xs tw-leading-5 tw-text-amber-100">
          {warnings.map((warning) => (
            <li key={`${warning.dropId}:${warning.code}`}>
              {t(locale, "publicReview.ledger.warningDiagnostic", {
                dropId: warning.dropId,
                reason: warning.reason,
              })}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
