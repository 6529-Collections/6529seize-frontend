"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Button from "@/components/utils/button/Button";
import type { ApiCollectRule } from "@/generated/models/ApiCollectRule";
import { ApiCollectRuleStateEnum } from "@/generated/models/ApiCollectRule";
import type { ApiCollectRuleTarget } from "@/generated/models/ApiCollectRuleTarget";
import type { ApiCollectRulePrepare } from "@/generated/models/ApiCollectRulePrepare";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import {
  pauseCollectRule,
  prepareCollectRule,
  reconcileCollectRule,
} from "@/services/api/collect-rules-api";
import {
  fetchMarketOperation,
  fetchMarketOrders,
} from "@/services/api/market-api";
import { useMutation } from "@tanstack/react-query";
import { useId, useRef, useState } from "react";
import CollectAssetReference from "./CollectAssetReference";
import {
  collectRuleRemaining,
  collectRuleTrade,
} from "./collect-rules.helpers";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO, validateMarketOperation } from "./market-validation";
import { saveMarketIntent } from "./market-operation-storage";

export default function CollectRuleCard({
  rule,
  onUpdated,
  onOperation,
}: {
  readonly rule: ApiCollectRule;
  readonly onUpdated: () => void;
  readonly onOperation: (operation: ApiMarketOperation) => void;
}) {
  const locale = useBrowserLocale();
  const externalDescriptionId = useId();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const connection = useSeizeConnectContext();
  const [acknowledged, setAcknowledged] = useState(false);
  const pendingPrepare = useRef<{
    target: string;
    revision: number;
    key: string;
    body: ApiCollectRulePrepare;
  } | null>(null);
  const canMutate =
    !activeProfileProxy &&
    connection.address?.toLowerCase() ===
      rule.definition.funding_wallet.toLowerCase() &&
    connection.canSignActiveWallet &&
    !connection.isSafeWallet;
  const external = !connectedProfile?.wallets?.some(
    (wallet) =>
      wallet.wallet.toLowerCase() === rule.definition.recipient.toLowerCase()
  );
  const update = useMutation({
    mutationFn: (action: "pause" | "resume" | "reconcile") =>
      action === "reconcile"
        ? reconcileCollectRule(rule.id)
        : pauseCollectRule(rule.id, {
            expected_revision: rule.revision,
            paused: action === "pause",
          }),
    onSuccess: onUpdated,
  });
  const inspect = useMutation({
    mutationFn: (id: string) => fetchMarketOperation(id),
    onSuccess: onOperation,
  });
  const prepare = useMutation({
    mutationFn: async (target: ApiCollectRuleTarget) => {
      if (!canMutate || (external && !acknowledged))
        throw new Error("RULE_WALLET_CHANGED");
      let pending = pendingPrepare.current;
      if (
        pending?.target !== target.asset_key ||
        pending.revision !== rule.revision
      ) {
        const orders = await fetchMarketOrders(target.asset_key, "LISTING");
        pending = {
          target: target.asset_key,
          revision: rule.revision,
          key: crypto.randomUUID(),
          body: {
            expected_revision: rule.revision,
            trade: collectRuleTrade(
              rule,
              target,
              orders.orders,
              external && acknowledged,
              orders.observed_at
            ),
          },
        };
        pendingPrepare.current = pending;
      }
      const result = await prepareCollectRule(
        rule.id,
        pending.body,
        pending.key
      );
      validateMarketOperation(result.operation, pending.body.trade);
      saveMarketIntent(rule.definition.profile_id, result.operation.id, {
        request: pending.body.trade,
      });
      return result.operation;
    },
    onSuccess: (operation) => {
      onUpdated();
      onOperation(operation);
    },
  });
  const busy = prepare.isPending || update.isPending || inspect.isPending;
  const active =
    rule.state === ApiCollectRuleStateEnum.Active && !rule.pending_review;
  const stateLabel = t(locale, `collect.rules.state.${rule.state}`);
  return (
    <article className="tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/30 tw-p-5">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {t(locale, "collect.rules.savedTargets", {
            count: rule.definition.targets.length,
          })}
        </h3>
        <span className="tw-rounded-full tw-bg-iron-800 tw-px-3 tw-py-1 tw-text-xs tw-text-iron-200">
          {stateLabel}
        </span>
      </div>
      <dl className="tw-grid tw-gap-3 tw-text-sm sm:tw-grid-cols-2">
        <div>
          <dt className="tw-text-iron-400">
            {t(locale, "collect.trade.payer")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-break-all tw-text-iron-200">
            {rule.definition.funding_wallet}
          </dd>
        </div>
        <div>
          <dt className="tw-text-iron-400">
            {t(locale, "collect.trade.destination")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-break-all tw-text-iron-200">
            {rule.definition.recipient}
          </dd>
        </div>
      </dl>
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "collect.rules.limits", {
          total: marketAmount(rule.definition.max_total_cost_wei, MARKET_ZERO),
          gas: marketAmount(rule.definition.max_gas_reserve_wei, MARKET_ZERO),
          actions: rule.definition.max_actions,
        })}
      </p>
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "collect.rules.spent", {
          amount: marketAmount(
            (
              BigInt(rule.spent_item_cost_wei) + BigInt(rule.spent_gas_cost_wei)
            ).toString(),
            MARKET_ZERO
          ),
          actions: rule.action_count,
        })}
      </p>
      <p className="tw-m-0 tw-text-xs tw-text-iron-400">
        {t(locale, "collect.rules.deadline", {
          date: formatDate(locale, rule.definition.expires_at, {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        })}
      </p>
      {external && (
        <div className="tw-space-y-2">
          <p
            id={externalDescriptionId}
            className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
          >
            {t(locale, "collect.recipient.external")}
          </p>
          <label className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            <input
              type="checkbox"
              aria-describedby={externalDescriptionId}
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="tw-mt-1 tw-h-5 tw-w-5 tw-shrink-0"
            />
            {t(locale, "collect.trade.acknowledgeExternal")}
          </label>
        </div>
      )}
      <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
        {rule.definition.targets.map((target) => (
          <li
            key={target.asset_key}
            className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3"
          >
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">
              <CollectAssetReference
                assetKey={target.asset_key}
                locale={locale}
              />{" "}
              ·{" "}
              {t(locale, "collect.rules.targetRemaining", {
                count: collectRuleRemaining(rule, target).toString(),
              })}{" "}
              · {marketAmount(target.maximum_unit_price_wei, MARKET_ZERO)}{" "}
              {t(locale, "collect.rules.perItem")}
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={
                !canMutate ||
                !active ||
                busy ||
                (external && !acknowledged) ||
                collectRuleRemaining(rule, target) === 0n
              }
              onClick={() => prepare.mutate(target)}
            >
              {t(locale, "collect.rules.prepare")}
            </Button>
          </li>
        ))}
      </ul>
      {!canMutate && (
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "collect.trade.reconnect")}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-3">
        {rule.pending_review && (
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => {
              if (rule.pending_review)
                inspect.mutate(rule.pending_review.operation_id);
            }}
          >
            {t(locale, "collect.rules.pending")}
          </Button>
        )}
        {(rule.state === ApiCollectRuleStateEnum.Active ||
          rule.state === ApiCollectRuleStateEnum.Paused) && (
          <Button
            variant="secondary"
            disabled={!canMutate || busy}
            onClick={() =>
              update.mutate(
                rule.state === ApiCollectRuleStateEnum.Active
                  ? "pause"
                  : "resume"
              )
            }
          >
            {t(
              locale,
              rule.state === ApiCollectRuleStateEnum.Active
                ? "collect.rules.pause"
                : "collect.rules.resume"
            )}
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={!canMutate || busy}
          onClick={() => update.mutate("reconcile")}
        >
          {t(locale, "collect.rules.refresh")}
        </Button>
      </div>
      {(prepare.isError || update.isError || inspect.isError) && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "collect.rules.error")}
        </p>
      )}
    </article>
  );
}
