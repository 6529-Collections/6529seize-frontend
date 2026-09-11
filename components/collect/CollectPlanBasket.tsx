"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import { ApiCollectTdhRequestHorizonDaysEnum } from "@/generated/models/ApiCollectTdhRequest";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import { isAddress, zeroAddress } from "viem";
import {
  fetchCollectAssets,
  projectCollectTdh,
} from "@/services/api/collect-api";
import { fetchMarketOrders } from "@/services/api/market-api";
import { useMutation } from "@tanstack/react-query";
import { collectAssetIdentity } from "./collect.adapters";
import CollectAssetReference from "./CollectAssetReference";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO } from "./market-validation";
import CollectSaveRule from "./CollectSaveRule";

async function findPlanPurchase(leg: ApiCollectPlanLeg) {
  const identity = collectAssetIdentity(leg.asset_key);
  if (!identity) throw new Error("UNSUPPORTED_ASSET");
  const [assets, orders] = await Promise.all([
    fetchCollectAssets({
      family: identity.family,
      query: identity.tokenId,
      page: 1,
    }),
    fetchMarketOrders(leg.asset_key, "LISTING"),
  ]);
  const asset = assets.data.find((item) => item.asset_key === leg.asset_key);
  const order = orders.orders.find(
    (item) =>
      item.identity.order_hash.toLowerCase() === leg.order_id.toLowerCase()
  );
  if (!asset || !order || BigInt(order.quantity) < BigInt(leg.quantity))
    throw new Error("ORDER_GONE");
  return { asset, order, leg };
}

export default function CollectPlanBasket({
  plan,
  onClose,
  onPurchase,
}: {
  readonly plan: ApiCollectPlan;
  readonly onClose: () => void;
  readonly onPurchase: (
    asset: ApiCollectAsset,
    order: ApiMarketTradeOrder,
    quantity: string,
    recipient: string
  ) => void;
}) {
  const locale = useBrowserLocale();
  const recipient = plan.result.recipient;
  const validRecipient = Boolean(
    recipient && isAddress(recipient) && recipient.toLowerCase() !== zeroAddress
  );
  const purchase = useMutation({
    mutationFn: (leg: ApiCollectPlanLeg) => {
      if (!validRecipient) throw new Error("PLAN_RECIPIENT_MISSING");
      return findPlanPurchase(leg);
    },
    onSuccess: ({ asset, order, leg }) => {
      if (plan.result.recipient)
        onPurchase(asset, order, leg.quantity, plan.result.recipient);
    },
  });
  const scenario = useMutation({ mutationFn: projectCollectTdh });
  return (
    <MobileWrapperDialog
      title={t(locale, "collect.plan.basket")}
      isOpen
      onClose={onClose}
      tabletModal
      hideOnDesktopHover={false}
      enableDragToClose={false}
    >
      <div className="tw-space-y-5 tw-p-5 sm:tw-p-6">
        <div>
          <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-100">
            {marketAmount(plan.result.total_cost_wei, MARKET_ZERO)}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "collect.plan.gasReserve")}
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "collect.plan.individual")}
          </p>
        </div>
        <dl className="tw-m-0 tw-text-sm">
          <dt className="tw-text-iron-400">
            {t(locale, "collect.trade.destination")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-break-all tw-text-iron-100">
            {plan.result.recipient}
          </dd>
        </dl>
        {!validRecipient && (
          <p role="alert" className="tw-text-sm tw-text-iron-300">
            {t(locale, "collect.plan.recipientMissing")}
          </p>
        )}
        <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0">
          {plan.result.legs.map((leg) => (
            <li
              key={leg.candidate_id}
              className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-py-4"
            >
              <p className="tw-m-0 tw-text-sm tw-text-iron-200">
                {leg.quantity} ×{" "}
                <CollectAssetReference
                  assetKey={leg.asset_key}
                  locale={locale}
                />
              </p>
              <Button
                variant="secondary"
                size="sm"
                disabled={purchase.isPending || !validRecipient}
                loading={
                  purchase.isPending &&
                  purchase.variables.candidate_id === leg.candidate_id
                }
                onClick={() => purchase.mutate(leg)}
              >
                {t(locale, "collect.plan.purchase")}
              </Button>
            </li>
          ))}
        </ul>
        {purchase.isError && (
          <p role="alert" className="tw-text-sm tw-text-iron-300">
            {t(locale, "collect.plan.orderGone")}
          </p>
        )}
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "collect.plan.remaining", {
            count: plan.result.remaining_requirements.length,
          })}
        </p>
        <Button
          variant="secondary"
          loading={scenario.isPending}
          disabled={!validRecipient || plan.result.legs.length === 0}
          onClick={() => {
            if (validRecipient && plan.result.recipient)
              scenario.mutate({
                profile_id: plan.profile_id,
                horizon_days: ApiCollectTdhRequestHorizonDaysEnum.NUMBER_30,
                acquisitions: plan.result.legs.map((leg) => ({
                  asset_key: leg.asset_key,
                  quantity: leg.quantity,
                  recipient: plan.result.recipient!,
                })),
              });
          }}
        >
          {t(locale, "collect.plan.tdhPreview")}
        </Button>
        {scenario.isError && (
          <p role="alert" className="tw-text-sm tw-text-iron-300">
            {t(locale, "collect.tdh.error")}
          </p>
        )}
        {scenario.data?.account.profile_id === plan.profile_id && (
          <div className="tw-rounded-xl tw-bg-iron-900 tw-p-4">
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">
              {t(locale, "collect.goal.horizonDays", {
                days: scenario.data.horizon_days,
              })}
            </p>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
              {t(locale, "collect.tdh.additional")}
            </p>
            <p className="tw-mb-0 tw-mt-1 tw-text-xl tw-font-semibold tw-text-iron-100">
              {formatNumber(locale, scenario.data.additional_tdh, {
                maximumFractionDigits: 2,
              })}{" "}
              TDH
            </p>
            <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400">
              {t(locale, "collect.tdh.rules", {
                version: scenario.data.rules_version,
                block: scenario.data.snapshot_block,
              })}
            </p>
          </div>
        )}
        {validRecipient && <CollectSaveRule plan={plan} />}
      </div>
    </MobileWrapperDialog>
  );
}
