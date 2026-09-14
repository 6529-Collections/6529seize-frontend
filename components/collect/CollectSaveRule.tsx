"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiCollectRuleDefinition } from "@/generated/models/ApiCollectRuleDefinition";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import { createCollectRule } from "@/services/api/collect-rules-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  collectRuleDeadlineFromPlan,
  collectRuleTargetsFromPlan,
} from "./collect-rules.helpers";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO } from "./market-validation";
import CollectAssetReference from "./CollectAssetReference";

export default function CollectSaveRule({
  plan,
}: {
  readonly plan: ApiCollectPlan;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, isAuthenticated } = useAuth();
  const connection = useSeizeConnectContext();
  const client = useQueryClient();
  const [review, setReview] = useState<ApiCollectRuleDefinition | null>(null);
  const pendingSave = useRef<{ fingerprint: string; key: string } | null>(null);
  const prepare = useMutation({
    mutationFn: () => {
      if (!connection.address || !plan.result.recipient)
        throw new Error("RULE_NO_WALLET");
      const definition: ApiCollectRuleDefinition = {
        profile_id: plan.profile_id,
        funding_wallet: connection.address,
        recipient: plan.result.recipient,
        plan_id: plan.id,
        analysis_id: plan.analysis.analysis_id,
        targets: collectRuleTargetsFromPlan(plan),
        max_total_cost_wei: plan.result.total_cost_wei,
        max_gas_reserve_wei: plan.gas_reserve_per_order_wei,
        expires_at: collectRuleDeadlineFromPlan(plan),
        max_actions: plan.result.legs.length,
      };
      setReview(definition);
      return Promise.resolve(definition);
    },
  });
  const save = useMutation({
    mutationFn: (body: ApiCollectRuleDefinition) => {
      const fingerprint = JSON.stringify(body);
      if (pendingSave.current?.fingerprint !== fingerprint)
        pendingSave.current = { fingerprint, key: crypto.randomUUID() };
      return createCollectRule(body, pendingSave.current.key);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [QueryKey.COLLECT_RULES] });
    },
  });
  const canSave = Boolean(
    isAuthenticated &&
    !activeProfileProxy &&
    !connection.isSafeWallet &&
    connection.canSignActiveWallet &&
    connectedProfile?.id === plan.profile_id &&
    connectedProfile.wallets?.some(
      (wallet) =>
        wallet.wallet.toLowerCase() === connection.address?.toLowerCase()
    )
  );
  if (save.isSuccess)
    return (
      <p role="status" className="tw-text-sm tw-text-iron-300">
        {t(locale, "collect.rules.saved")}{" "}
        <Link href="/collect/orders" className="tw-text-primary-300">
          {t(locale, "collect.rules.manage")}
        </Link>
      </p>
    );
  return (
    <section className="tw-space-y-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4">
      <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
        {t(locale, "collect.rules.saveTitle")}
      </h3>
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "collect.rules.mode")}
      </p>
      {!review && (
        <Button
          variant="secondary"
          disabled={!canSave || plan.result.legs.length === 0}
          loading={prepare.isPending}
          onClick={() => prepare.mutate()}
        >
          {t(locale, "collect.rules.review")}
        </Button>
      )}
      {review && (
        <>
          <ul className="tw-m-0 tw-space-y-2 tw-pl-4 tw-text-sm tw-text-iron-300">
            {review.targets.map((target) => (
              <li key={target.asset_key}>
                {target.target_quantity} ×{" "}
                <CollectAssetReference
                  assetKey={target.asset_key}
                  locale={locale}
                />{" "}
                · {marketAmount(target.maximum_unit_price_wei, MARKET_ZERO)}{" "}
                {t(locale, "collect.rules.perItem")}
              </li>
            ))}
          </ul>
          <p className="tw-m-0 tw-break-all tw-text-sm tw-text-iron-300">
            {t(locale, "collect.trade.payer")}: {review.funding_wallet}
          </p>
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "collect.rules.limits", {
              total: marketAmount(review.max_total_cost_wei, MARKET_ZERO),
              gas: marketAmount(review.max_gas_reserve_wei, MARKET_ZERO),
              actions: review.max_actions,
            })}
          </p>
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "collect.rules.deadline", {
              date: formatDate(locale, review.expires_at, {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.rules.planningLimits")}
          </p>
          <Button
            variant="primary"
            disabled={
              !canSave ||
              review.funding_wallet.toLowerCase() !==
                connection.address?.toLowerCase()
            }
            loading={save.isPending}
            onClick={() => save.mutate(review)}
          >
            {t(locale, "collect.rules.save")}
          </Button>
        </>
      )}
      {(prepare.isError || save.isError) && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(
            locale,
            prepare.isError
              ? "collect.rules.refreshPlan"
              : "collect.rules.error"
          )}
        </p>
      )}
    </section>
  );
}
