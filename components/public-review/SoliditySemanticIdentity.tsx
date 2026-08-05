import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function SoliditySemanticIdentity({
  routeKey,
  semanticId,
}: {
  readonly routeKey: string;
  readonly semanticId: string;
}) {
  return (
    <details className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-px-3">
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
        {t(DEFAULT_LOCALE, "publicReview.reference.semanticIdentity")}
      </summary>
      <dl className="tw-mb-3 tw-mt-1 tw-grid tw-gap-3">
        <div className="tw-min-w-0">
          <dt className="tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            {t(DEFAULT_LOCALE, "publicReview.reference.semanticId")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
            {semanticId}
          </dd>
        </div>
        <div className="tw-min-w-0">
          <dt className="tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            {t(DEFAULT_LOCALE, "publicReview.reference.routeKey")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
            {routeKey}
          </dd>
        </div>
      </dl>
    </details>
  );
}
