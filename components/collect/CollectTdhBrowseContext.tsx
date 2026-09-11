import {
  ApiCollectTdhListingsStatusEnum,
  type ApiCollectTdhListings,
} from "@/generated/models/ApiCollectTdhListings";
import type { SupportedLocale } from "@/i18n/locales";
import { formatDate, formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";

export default function CollectTdhBrowseContext({
  snapshot,
  locale,
  onOpenProjection,
}: {
  readonly snapshot: ApiCollectTdhListings | undefined;
  readonly locale: SupportedLocale;
  readonly onOpenProjection?: () => void;
}) {
  return (
    <div className="tw-space-y-2 tw-text-xs tw-leading-5 tw-text-iron-400">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-1">
        <p className="tw-m-0">{t(locale, "collect.tdhBrowse.scope")}</p>
        {onOpenProjection && (
          <button
            type="button"
            onClick={onOpenProjection}
            className="tw-min-h-11 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-xs tw-text-iron-200 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "collect.tdhBrowse.target")}
          </button>
        )}
      </div>
      <details>
        <summary className="tw-min-h-11 tw-w-fit tw-cursor-pointer tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "collect.tdhBrowse.explain")}
        </summary>
        <div className="tw-max-w-2xl tw-space-y-2 tw-pb-3">
          <p className="tw-m-0">{t(locale, "collect.tdhBrowse.method")}</p>
          <p className="tw-m-0">{t(locale, "collect.tdhBrowse.profile")}</p>
          {snapshot?.observed_at && (
            <p className="tw-m-0">
              {t(locale, "collect.tdhBrowse.snapshot", {
                date: formatDate(locale, snapshot.observed_at, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
                count: formatNumber(locale, snapshot.evaluated_ask_count),
              })}
            </p>
          )}
          {snapshot &&
            !snapshot.coverage_complete &&
            snapshot.status !== ApiCollectTdhListingsStatusEnum.Unavailable && (
              <p className="tw-m-0">{t(locale, "collect.tdhBrowse.bounded")}</p>
            )}
        </div>
      </details>
      {snapshot?.status === ApiCollectTdhListingsStatusEnum.Stale && (
        <p role="status" className="tw-m-0">
          {t(locale, "collect.tdhBrowse.stale")}
        </p>
      )}
      {snapshot?.status === ApiCollectTdhListingsStatusEnum.Unavailable && (
        <p role="status" className="tw-m-0">
          {t(locale, "collect.tdhBrowse.unavailable")}
        </p>
      )}
    </div>
  );
}
