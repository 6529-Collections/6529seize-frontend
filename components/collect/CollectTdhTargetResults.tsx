"use client";

import Button from "@/components/utils/button/Button";
import {
  ApiCollectTdhTargetPlanStatusEnum,
  type ApiCollectTdhTargetPlan,
} from "@/generated/models/ApiCollectTdhTargetPlan";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatDecimalString, formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import Link from "next/link";
import { formatEther } from "viem";
import CollectAssetMedia from "./CollectAssetMedia";
import { collectAssetHref } from "./collect.adapters";
import { collectBuyAmount, collectListingKey } from "./collect-buy.helpers";

export default function CollectTdhTargetResults({
  plan,
  onReview,
  onPlanOffers,
  offersDisabledReason,
}: {
  readonly plan: ApiCollectTdhTargetPlan;
  readonly onReview: () => void;
  readonly onPlanOffers?: (() => void) | undefined;
  readonly offersDisabledReason?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const noPurchase =
    plan.status === ApiCollectTdhTargetPlanStatusEnum.NoPurchaseNeeded;
  const met =
    plan.status === ApiCollectTdhTargetPlanStatusEnum.TargetMetBestFound;
  let title:
    | "collect.tdhTarget.noPurchase"
    | "collect.tdhTarget.bestFound"
    | "collect.tdhTarget.partial" = "collect.tdhTarget.partial";
  if (noPurchase) title = "collect.tdhTarget.noPurchase";
  else if (met) title = "collect.tdhTarget.bestFound";
  const eth = (value: string) =>
    `${formatDecimalString(locale, formatEther(BigInt(value)))} ETH`;
  const summary = [
    {
      label: "collect.tdhTarget.baseline",
      value: formatNumber(locale, plan.projection.baseline.boosted_tdh),
    },
    {
      label: "collect.tdhTarget.projected",
      value: formatNumber(locale, plan.projection.proposed.boosted_tdh),
    },
    {
      label: "collect.tdhTarget.target",
      value: formatDecimalString(locale, plan.target_total_tdh),
    },
  ] as const;
  return (
    <section
      aria-label={t(locale, title)}
      className="tw-max-w-3xl tw-space-y-5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-6"
    >
      <div role="status">
        <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, title)}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
          {t(locale, "collect.tdhTarget.deadline", {
            date: formatDate(locale, plan.projection.evaluated_at, {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            }),
          })}
        </p>
        {noPurchase && (
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "collect.tdhTarget.noPurchaseDescription")}
          </p>
        )}
      </div>
      <dl className="tw-m-0 tw-grid tw-gap-4 sm:tw-grid-cols-3">
        {summary.map((item) => (
          <div key={item.label}>
            <dt className="tw-text-xs tw-text-iron-400">
              {t(locale, item.label)}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-lg tw-tabular-nums tw-text-iron-100">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {plan.shortfall_tdh !== "0" && (
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "collect.tdhTarget.remaining", {
            tdh: formatDecimalString(locale, plan.shortfall_tdh),
          })}
        </p>
      )}
      {plan.items.length > 0 ? (
        <ol className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/10 tw-p-0">
          {plan.items.map((item) => (
            <li
              key={collectListingKey(item.order)}
              className="tw-flex tw-items-center tw-gap-3 tw-py-3"
            >
              <Link
                href={collectAssetHref(item.asset)}
                className="tw-relative tw-block tw-size-16 tw-shrink-0 tw-overflow-hidden tw-rounded-sm"
              >
                <CollectAssetMedia
                  src={item.asset.image_url}
                  name={item.asset.name}
                />
              </Link>
              <div className="tw-min-w-0 tw-flex-1">
                <Link
                  href={collectAssetHref(item.asset)}
                  className="tw-text-sm tw-text-iron-100 tw-no-underline hover:tw-underline"
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
              <span className="tw-text-right tw-text-sm tw-tabular-nums tw-text-iron-200">
                {eth(collectBuyAmount(item.order, item.quantity) ?? "0")}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        !noPurchase && (
          <p className="tw-text-sm tw-text-iron-300">
            {t(locale, "collect.tdhTarget.noPlan")}
          </p>
        )
      )}
      <dl className="tw-m-0 tw-space-y-2 tw-text-sm">
        <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-2">
          <dt className="tw-text-iron-400">
            {t(locale, "collect.tdhTarget.purchaseSubtotal")}
          </dt>
          <dd className="tw-m-0 tw-tabular-nums tw-text-iron-100">
            {eth(plan.purchase_cost_wei)}
          </dd>
        </div>
        <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-2">
          <dt className="tw-text-iron-400">
            {t(locale, "collect.tdhTarget.gas")}
          </dt>
          <dd className="tw-m-0 tw-text-iron-300">
            {plan.gas_estimate_wei === null
              ? t(locale, "collect.tdhTarget.gasAtReview")
              : eth(plan.gas_estimate_wei)}
          </dd>
        </div>
      </dl>
      {plan.items.length > 0 && (
        <div className="tw-space-y-3">
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.tdhTarget.reviewHint")}
          </p>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
            <Button variant="primary" onClick={onReview}>
              {t(locale, "collect.tdhTarget.review")}
            </Button>
            {onPlanOffers && (
              <Button
                variant="tertiary"
                onClick={onPlanOffers}
                disabled={Boolean(offersDisabledReason)}
              >
                {t(locale, "collect.tdhTarget.offer")}
              </Button>
            )}
          </div>
          {offersDisabledReason && (
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {offersDisabledReason}
            </p>
          )}
          {onPlanOffers && (
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "collect.tdhTarget.offerTiming")}
            </p>
          )}
        </div>
      )}
      {!noPurchase && (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.tdhTarget.searchLimit")}
        </p>
      )}
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
            {t(locale, "collect.tdhTarget.searchWork", {
              count: formatNumber(locale, plan.search.evaluated_count),
              limit: formatNumber(locale, plan.search.evaluation_limit),
            })}
          </p>
          <p>
            {t(locale, "collect.tdhTarget.updated", {
              block: plan.projection.snapshot_block,
              version: plan.projection.rules_version,
            })}
          </p>
          <p>
            {t(locale, "collect.tdhTarget.feesIncluded", {
              fees: eth(plan.signed_fees_wei),
            })}
          </p>
          <ul className="tw-space-y-2 tw-pl-4">
            {[
              ...new Set([...plan.assumptions, ...plan.projection.assumptions]),
            ].map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
