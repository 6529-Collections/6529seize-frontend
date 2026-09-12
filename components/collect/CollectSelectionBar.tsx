"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO } from "./market-validation";
import {
  collectSelectionTotal,
  type CollectSelectedListing,
} from "./collect-selection.helpers";

export default function CollectSelectionBar({
  items,
  onReview,
  onClear,
  onPlanOffers,
}: {
  readonly items: readonly CollectSelectedListing[];
  readonly onReview: () => void;
  readonly onClear: () => void;
  readonly onPlanOffers?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  if (items.length === 0) return null;
  const total = collectSelectionTotal(items);
  return (
    <section
      aria-label={t(locale, "collect.selection.title")}
      className="tw-sticky tw-bottom-4 tw-z-10 tw-mx-auto tw-mt-6 tw-flex tw-max-w-3xl tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/15 tw-bg-iron-950 tw-p-4 tw-shadow-xl"
    >
      <div aria-live="polite">
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
          {t(locale, "collect.selection.count", { count: items.length })}
        </p>
        {total !== null && (
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.selection.estimate", {
              price: marketAmount(total, MARKET_ZERO),
            })}
          </p>
        )}
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <Button variant="secondary" size="sm" onClick={onClear}>
          {t(locale, "collect.selection.clear")}
        </Button>
        {onPlanOffers && (
          <Button variant="secondary" size="sm" onClick={onPlanOffers}>
            {t(locale, "collect.offerWorkspace.plan")}
          </Button>
        )}
        <Button
          variant="action"
          size="sm"
          disabled={total === null}
          onClick={onReview}
        >
          {t(locale, "collect.selection.review")}
        </Button>
      </div>
    </section>
  );
}
