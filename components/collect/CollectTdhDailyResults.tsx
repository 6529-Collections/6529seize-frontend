"use client";

import Button from "@/components/utils/button/Button";
import type { ApiCollectDailyTdhPlan } from "@/generated/models/ApiCollectDailyTdhPlan";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import Link from "next/link";
import { useState } from "react";
import { formatUnits } from "viem";
import CollectAssetMedia from "./CollectAssetMedia";
import { collectAssetHref } from "./collect.adapters";
import { collectBuyAmount, collectListingKey } from "./collect-buy.helpers";
import { collectPlanAmount } from "./collect-plan-amounts";
import { PhotoIcon } from "@heroicons/react/24/outline";

export default function CollectTdhDailyResults({
  plan,
  onReview,
  onPlanOffers,
  offersDisabledReason,
  error,
}: {
  readonly plan: ApiCollectDailyTdhPlan;
  readonly onReview: () => void;
  readonly onPlanOffers?: (() => void) | undefined;
  readonly offersDisabledReason?: string | undefined;
  readonly error?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const [visible, setVisible] = useState(12);
  const effects = plan.personal_effects;
  const decimal = (value: string, places: number) =>
    formatDecimalString(locale, formatUnits(BigInt(value), places));
  const eth = (value: string) => collectPlanAmount(locale, value).compact;
  return (
    <section
      aria-label={t(locale, "collect.tdhDaily.resultTitle")}
      className="tw-min-w-0 tw-space-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5"
    >
      {plan.shortfall_base_tdh_per_day_hundredths !== null &&
        plan.shortfall_base_tdh_per_day_hundredths !== "0" && (
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "collect.tdhDaily.shortfall", {
              value: decimal(plan.shortfall_base_tdh_per_day_hundredths, 2),
            })}
          </p>
        )}
      {plan.items.length > 0 ? (
        <>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <Button className="tw-min-h-11" onClick={onReview}>
              {t(locale, "collect.tdhTarget.review")}
            </Button>
            {onPlanOffers && (
              <Button
                className="tw-min-h-11"
                variant="tertiary"
                onClick={onPlanOffers}
                disabled={Boolean(offersDisabledReason)}
              >
                {t(locale, "collect.tdhTarget.offer")}
              </Button>
            )}
          </div>
          {offersDisabledReason && (
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">
              {offersDisabledReason}
            </p>
          )}
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.tdhTarget.reviewHint")}
          </p>
          <ol className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/10 tw-p-0">
            {plan.items.slice(0, visible).map((item) => {
              const amount = collectBuyAmount(item.order, item.quantity);
              return (
                <li
                  key={collectListingKey(item.order)}
                  className="tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-py-3"
                >
                  <Link
                    href={collectAssetHref(item.asset)}
                    aria-label={t(locale, "collect.artworkLink", {
                      title: item.asset.name,
                    })}
                    className="tw-relative tw-block tw-size-12 tw-shrink-0 tw-overflow-hidden tw-rounded-sm"
                  >
                    {item.asset.image_url ? (
                      <CollectAssetMedia
                        src={item.asset.image_url}
                        name={item.asset.name}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-iron-950 tw-text-iron-600"
                      >
                        <PhotoIcon className="tw-size-5" />
                      </span>
                    )}
                  </Link>
                  <div className="tw-min-w-0 tw-flex-1">
                    <Link
                      href={collectAssetHref(item.asset)}
                      className="tw-break-words tw-text-sm tw-text-iron-100 tw-no-underline hover:tw-underline"
                    >
                      {item.asset.name}
                    </Link>
                    <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-400">
                      {t(
                        locale,
                        item.quantity === "1"
                          ? "collect.tdhTarget.oneEdition"
                          : "collect.tdhTarget.quantity",
                        { quantity: formatDecimalString(locale, item.quantity) }
                      )}
                    </p>
                  </div>
                  {amount === null ? (
                    <span className="tw-text-iron-400">—</span>
                  ) : (
                    <details className="tw-max-w-[45%] tw-text-right tw-text-sm tw-tabular-nums tw-text-iron-200 [overflow-wrap:anywhere]">
                      <summary className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                        {eth(amount)}
                      </summary>
                      <span className="tw-text-xs tw-text-iron-400">
                        {collectPlanAmount(locale, amount).exact}
                      </span>
                    </details>
                  )}
                </li>
              );
            })}
          </ol>
          {visible < plan.items.length && (
            <Button
              className="tw-min-h-11"
              variant="tertiary"
              onClick={() => setVisible((count) => count + 12)}
            >
              {t(locale, "collect.tdhDaily.more", {
                count: formatNumber(locale, plan.items.length - visible),
              })}
            </Button>
          )}
        </>
      ) : (
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "collect.tdhTarget.noPlan")}
        </p>
      )}
      {error && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {error}
        </p>
      )}
      <details className="tw-min-w-0">
        <summary className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-py-3 tw-text-sm tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "collect.tdhDaily.personal")}
        </summary>
        <dl className="tw-m-0 tw-space-y-3 tw-text-sm">
          <div>
            <dt className="tw-text-iron-400">
              {t(locale, "collect.tdhDaily.boost")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-iron-100">
              {t(locale, "collect.tdhDaily.boostChange", {
                before: formatNumber(locale, effects.baseline_boost, {
                  maximumFractionDigits: 4,
                }),
                after: formatNumber(locale, effects.proposed_boost, {
                  maximumFractionDigits: 4,
                }),
              })}
            </dd>
          </div>
          <div>
            <dt className="tw-text-iron-400">
              {t(locale, "collect.tdhDaily.personalRate")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-iron-100">
              {t(locale, "collect.tdhDaily.rateChange", {
                before: decimal(
                  effects.baseline_boosted_tdh_per_day_ten_thousandths,
                  4
                ),
                after: decimal(
                  effects.proposed_boosted_tdh_per_day_ten_thousandths,
                  4
                ),
              })}
            </dd>
          </div>
          <div>
            <dt className="tw-text-iron-400">
              {t(locale, "collect.tdhDaily.existingStock")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-iron-100">
              {formatNumber(locale, effects.changed_boost_on_existing_tdh)}
            </dd>
          </div>
        </dl>
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.tdhDaily.stockExplanation")}
        </p>
      </details>
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "collect.tdhDaily.limit")}
      </p>
      <details>
        <summary className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-py-3 tw-text-xs tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "collect.tdhTarget.assumptions")}
        </summary>
        <div className="tw-space-y-2 tw-text-xs tw-leading-5 tw-text-iron-400">
          <p>
            {t(locale, "collect.tdhTarget.coverage", {
              orders: formatNumber(locale, plan.coverage.evaluated_ask_count),
              candidates: formatNumber(locale, plan.coverage.candidate_count),
            })}
          </p>
          {!plan.coverage.index_complete && (
            <p>{t(locale, "collect.tdhTarget.partialIndex")}</p>
          )}
          <p>
            {t(locale, "collect.tdhTarget.feesIncluded", {
              fees: eth(plan.signed_fees_wei),
            })}
          </p>
          <ul className="tw-space-y-2 tw-pl-4">
            {plan.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
