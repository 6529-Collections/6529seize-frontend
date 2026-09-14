"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CollectReviewDisclosure } from "./CollectReviewPrimitives";
import type { MarketReviewChangeNotice } from "./market-review-change-description";

export default function CollectReviewChangeDetails({
  notice,
}: {
  readonly notice: MarketReviewChangeNotice;
}) {
  const locale = useBrowserLocale();
  if (notice.details.length === 0) return null;
  return (
    <CollectReviewDisclosure
      label={t(locale, "collect.review.exactChanges")}
      nested
    >
      <dl className="tw-m-0 tw-space-y-4">
        {notice.details.map((detail) => (
          <div key={detail.label} className="tw-space-y-1">
            <dt className="tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-200">
              {detail.label}
            </dt>
            <dd className="tw-m-0 tw-space-y-1 tw-text-xs tw-tabular-nums tw-leading-5 [overflow-wrap:anywhere]">
              <div className="tw-text-iron-400">
                {t(locale, "collect.review.previousValue", {
                  value: detail.before,
                })}
              </div>
              <div className="tw-text-iron-200">
                {t(locale, "collect.review.updatedValue", {
                  value: detail.after,
                })}
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </CollectReviewDisclosure>
  );
}
