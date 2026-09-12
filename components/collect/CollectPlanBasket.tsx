"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import { ApiCollectTdhRequestHorizonDaysEnum } from "@/generated/models/ApiCollectTdhRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDecimalString, formatNumber } from "@/i18n/format";
import { isAddress, zeroAddress } from "viem";
import { projectCollectTdh } from "@/services/api/collect-api";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import CollectAssetReference from "./CollectAssetReference";
import CollectBatchController from "./CollectBatchController";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import {
  collectPlanLegCost,
  collectPlanSelectionCost,
  resolveCollectPlanSelection,
} from "./collect-plan-selection.helpers";
import { MARKET_BATCH_LIMITS } from "./market-batch-validation";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO } from "./market-validation";
import CollectSaveRule from "./CollectSaveRule";

interface Props {
  readonly plan: ApiCollectPlan;
  readonly onClose: () => void;
  readonly onSettled?: () => void;
}
type Review =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; priceChanged: boolean }
  | { status: "ready"; items: readonly CollectSelectedListing[] };

export default function CollectPlanBasket(props: Props) {
  return (
    <PlanBasket key={`${props.plan.id}:${props.plan.revision}`} {...props} />
  );
}

function PlanBasket({ plan, onClose, onSettled }: Props) {
  const locale = useBrowserLocale(),
    id = useId();
  const [selected, setSelected] = useState(
    () => new Set(plan.result.legs.map((leg) => leg.candidate_id))
  );
  const [review, setReview] = useState<Review>({ status: "idle" });
  const pending = useRef<AbortController | null>(null);
  const focusReview = useCallback(
    (node: HTMLDivElement | null) => node?.focus(),
    []
  );
  useEffect(() => () => pending.current?.abort(), []);
  const recipient = plan.result.recipient;
  const validRecipient = Boolean(
    recipient && isAddress(recipient) && recipient.toLowerCase() !== zeroAddress
  );
  const chosen = plan.result.legs.filter((leg) =>
    selected.has(leg.candidate_id)
  );
  const total = collectPlanSelectionCost(chosen);
  const priceLabel =
    total === null
      ? t(locale, "collect.plan.priceUnavailable")
      : t(locale, "collect.plan.selectionEstimate", {
          price: marketAmount(total, MARKET_ZERO),
        });
  const all = chosen.length === plan.result.legs.length && chosen.length > 0;
  const overLimit = chosen.length > MARKET_BATCH_LIMITS.orders;
  const loading = review.status === "loading";
  const scenario = useMutation({ mutationFn: projectCollectTdh });
  const acquisitions = chosen.map((leg) => ({
    asset_key: leg.asset_key,
    quantity: leg.quantity,
    recipient: recipient ?? "",
  }));
  const scenarioMatchesSelection =
    JSON.stringify(scenario.variables?.acquisitions) ===
    JSON.stringify(acquisitions);
  const recipientProps = recipient ? { initialRecipient: recipient } : {};
  const settledProps = onSettled ? { onSettled } : {};
  const close = () => {
    pending.current?.abort();
    onClose();
  };
  const toggle = (candidate: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(candidate)) next.delete(candidate);
      else next.add(candidate);
      return next;
    });
    setReview({ status: "idle" });
  };
  const checkSelection = async () => {
    if (pending.current || !validRecipient || !chosen.length || overLimit)
      return;
    const controller = new AbortController();
    pending.current = controller;
    setReview({ status: "loading" });
    try {
      const items = await resolveCollectPlanSelection(
        chosen,
        plan.analysis.account.wallets,
        controller.signal
      );
      if (!controller.signal.aborted) setReview({ status: "ready", items });
    } catch (error) {
      if (!controller.signal.aborted)
        setReview({
          status: "error",
          priceChanged:
            error instanceof Error && error.message === "PLAN_PRICE_CHANGED",
        });
    } finally {
      controller.abort();
      if (pending.current === controller) pending.current = null;
    }
  };
  return (
    <MobileWrapperDialog
      title={t(locale, "collect.plan.basket")}
      isOpen
      onClose={close}
      tabletModal
      hideOnDesktopHover={false}
      enableDragToClose={false}
    >
      {review.status === "ready" ? (
        <div
          ref={focusReview}
          tabIndex={-1}
          role="region"
          aria-label={t(locale, "collect.plan.basket")}
          className="focus:tw-outline-none"
        >
          <CollectBatchController
            items={review.items}
            {...recipientProps}
            presentation="contents"
            onClose={close}
            {...settledProps}
          />
        </div>
      ) : (
        <div className="tw-space-y-5 tw-p-5 sm:tw-p-6">
          <div>
            <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100">
              {t(locale, "collect.batchReview.selected", {
                selected: formatNumber(locale, chosen.length),
                total: formatNumber(locale, plan.result.legs.length),
              })}
            </h2>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "collect.plan.batchDescription")}
            </p>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-200">
              {priceLabel}
            </p>
          </div>
          <dl className="tw-m-0 tw-text-sm">
            <dt className="tw-text-iron-400">
              {t(locale, "collect.trade.destination")}
            </dt>
            <dd className="tw-m-0 tw-mt-2 tw-break-all tw-text-iron-100">
              {recipient}
            </dd>
          </dl>
          {!validRecipient && (
            <p role="alert" className="tw-text-sm tw-text-iron-300">
              {t(locale, "collect.plan.recipientMissing")}
            </p>
          )}
          {overLimit && (
            <p role="alert" className="tw-text-sm tw-text-iron-300">
              {t(locale, "collect.selection.limit", {
                count: formatNumber(locale, MARKET_BATCH_LIMITS.orders),
              })}
            </p>
          )}
          <label className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-3 tw-text-sm tw-text-iron-100">
            <input
              type="checkbox"
              checked={all}
              disabled={loading}
              ref={(node) => {
                if (node) node.indeterminate = chosen.length > 0 && !all;
              }}
              onChange={() => {
                setSelected(
                  all
                    ? new Set()
                    : new Set(plan.result.legs.map((leg) => leg.candidate_id))
                );
                setReview({ status: "idle" });
              }}
              className="tw-size-4 tw-accent-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            />
            {t(locale, "collect.batchReview.selectAll")}
          </label>
          <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0">
            {plan.result.legs.map((leg, index) => {
              const cost = collectPlanLegCost(leg);
              const costLabel =
                cost === null
                  ? t(locale, "collect.plan.priceUnavailable")
                  : marketAmount(cost, MARKET_ZERO);
              return (
                <li
                  key={leg.candidate_id}
                  className="tw-flex tw-items-center tw-gap-3 tw-py-3"
                >
                  <input
                    id={`${id}-${index}`}
                    type="checkbox"
                    checked={selected.has(leg.candidate_id)}
                    disabled={loading}
                    aria-labelledby={`${id}-${index}-label`}
                    onChange={() => toggle(leg.candidate_id)}
                    className="tw-size-4 tw-shrink-0 tw-accent-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                  />
                  <div className="tw-min-w-0 tw-flex-1 tw-text-sm">
                    <label
                      id={`${id}-${index}-label`}
                      htmlFor={`${id}-${index}`}
                      className="tw-flex tw-min-h-11 tw-cursor-pointer tw-flex-wrap tw-items-center tw-gap-1 tw-text-iron-200"
                    >
                      {formatDecimalString(locale, leg.quantity)} ×{" "}
                      <CollectAssetReference
                        assetKey={leg.asset_key}
                        locale={locale}
                      />
                    </label>
                    <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                      {costLabel}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {review.status === "error" && (
            <p role="alert" className="tw-text-sm tw-text-iron-300">
              {t(
                locale,
                review.priceChanged
                  ? "collect.plan.priceChanged"
                  : "collect.plan.orderGone"
              )}
            </p>
          )}
          <Button
            fullWidth
            loading={loading}
            disabled={!validRecipient || !chosen.length || overLimit}
            onClick={() => {
              void checkSelection();
            }}
          >
            {t(locale, "collect.plan.checkSelection")}
          </Button>
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, "collect.plan.remaining", {
              count: formatNumber(
                locale,
                plan.result.remaining_requirements.length
              ),
            })}
          </p>
          <Button
            variant="secondary"
            loading={scenario.isPending}
            disabled={!validRecipient || !chosen.length || loading}
            onClick={() => {
              if (validRecipient)
                scenario.mutate({
                  profile_id: plan.profile_id,
                  horizon_days: ApiCollectTdhRequestHorizonDaysEnum.NUMBER_30,
                  acquisitions,
                });
            }}
          >
            {t(locale, "collect.plan.selectedTdhPreview")}
          </Button>
          {scenario.isError && (
            <p role="alert" className="tw-text-sm tw-text-iron-300">
              {t(locale, "collect.tdh.error")}
            </p>
          )}
          {scenario.data?.account.profile_id === plan.profile_id &&
            scenarioMatchesSelection && (
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
      )}
    </MobileWrapperDialog>
  );
}
