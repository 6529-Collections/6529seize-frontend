"use client";

import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { ApiCollectTdhRankingRequestHorizonDaysEnum } from "@/generated/models/ApiCollectTdhRankingRequest";
import type { ApiCollectTdhRankingRequest } from "@/generated/models/ApiCollectTdhRankingRequest";
import type { ApiCollectTdhRanking } from "@/generated/models/ApiCollectTdhRanking";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import { compareCollectTdh } from "@/services/api/collect-api";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { formatEther, isAddress, parseEther, zeroAddress } from "viem";
import type { CollectCollection, CollectGoalDraft } from "./collect.types";
import CollectGoalForm from "./CollectGoalForm";
import CollectRecipientPicker from "./CollectRecipientPicker";
import CollectAssetReference from "./CollectAssetReference";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO } from "./market-validation";
import type { SupportedLocale } from "@/i18n/locales";
import { isPositiveEthAmount } from "./collect-form.validation";

function TdhResults({
  ranking,
  budgetWei,
  locale,
}: {
  readonly ranking: ApiCollectTdhRanking;
  readonly budgetWei: string;
  readonly locale: SupportedLocale;
}) {
  const candidates = ranking.ranked.filter(
    (candidate) =>
      BigInt(candidate.total_cost_wei) <= BigInt(budgetWei) &&
      candidate.additional_tdh > 0
  );
  return (
    <div className="tw-space-y-4">
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "collect.tdh.scope", {
          count: ranking.evaluated_count,
          days: ranking.horizon_days,
        })}
      </p>
      <p className="tw-m-0 tw-text-xs tw-text-iron-400">
        {t(locale, "collect.tdh.rules", {
          version: ranking.rules_version,
          block: ranking.snapshot_block,
        })}
      </p>
      {candidates.length === 0 ? (
        <p className="tw-text-sm tw-text-iron-300">
          {t(locale, "collect.tdh.empty")}
        </p>
      ) : (
        <ol className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
          {candidates.map((candidate) => (
            <li
              key={candidate.candidate_id}
              className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4"
            >
              <div className="tw-mb-4 tw-flex tw-flex-wrap tw-justify-between tw-gap-3">
                <strong className="tw-text-lg tw-tabular-nums tw-text-iron-100">
                  {formatNumber(locale, candidate.additional_tdh, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  TDH
                </strong>
                <span className="tw-text-sm tw-tabular-nums tw-text-iron-200">
                  {marketAmount(candidate.total_cost_wei, MARKET_ZERO)}
                </span>
              </div>
              <ul className="tw-mb-4 tw-list-none tw-space-y-1 tw-p-0 tw-text-xs tw-text-iron-300">
                {candidate.acquisitions.map((asset) => (
                  <li key={`${asset.asset_key}:${asset.recipient}`}>
                    {asset.quantity} ×{" "}
                    <CollectAssetReference
                      assetKey={asset.asset_key}
                      locale={locale}
                    />
                  </li>
                ))}
              </ul>
              <dl className="tw-m-0 tw-grid tw-gap-3 sm:tw-grid-cols-3">
                <div>
                  <dt className="tw-text-xs tw-text-iron-400">
                    {t(locale, "collect.tdh.base")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                    {formatNumber(locale, candidate.additional_base_tdh, {
                      maximumFractionDigits: 2,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="tw-text-xs tw-text-iron-400">
                    {t(locale, "collect.tdh.existing")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                    {formatNumber(
                      locale,
                      candidate.changed_boost_on_existing_holdings,
                      { maximumFractionDigits: 2 }
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="tw-text-xs tw-text-iron-400">
                    {t(locale, "collect.tdh.rate")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                    {candidate.cost_per_additional_tdh &&
                    candidate.cost_per_additional_tdh.denominator_tdh > 0
                      ? `≈ ${formatNumber(locale, Number(formatEther(BigInt(candidate.cost_per_additional_tdh.numerator_wei))) / candidate.cost_per_additional_tdh.denominator_tdh, { maximumSignificantDigits: 6 })}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
      <p className="tw-text-xs tw-text-iron-400">
        {t(locale, "collect.tdh.excluded", { count: ranking.excluded.length })}
      </p>
      <details>
        <summary className="tw-cursor-pointer tw-py-3 tw-text-sm tw-text-iron-300">
          {t(locale, "collect.tdh.assumptions")}
        </summary>
        <ul className="tw-space-y-2 tw-pl-4 tw-text-xs tw-leading-5 tw-text-iron-400">
          {ranking.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export default function CollectTdhController({
  collection,
  profile,
  onConnect,
}: {
  readonly collection: CollectCollection;
  readonly profile: ApiIdentity | null;
  readonly onConnect: () => void;
}) {
  const locale = useBrowserLocale();
  const [draft, setDraft] = useState<CollectGoalDraft>({
    intent: "tdh",
    definitionId: "",
    targetCount: "1",
    budgetEth: "",
    horizonDays: "30",
    includeCollaborations: true,
  });
  const [recipient, setRecipient] = useState(profile?.primary_wallet ?? "");
  const [recipientError, setRecipientError] = useState(false);
  const [budgetError, setBudgetError] = useState(false);
  const compare = useMutation({
    mutationFn: async ({
      request,
      budgetWei,
    }: {
      request: ApiCollectTdhRankingRequest;
      budgetWei: string;
    }) => ({ ranking: await compareCollectTdh(request), budgetWei }),
  });
  const family = Object.values(ApiCollectFamily).find(
    (value) => value.toString() === collection
  );
  const requestError = compare.isError
    ? t(locale, "collect.tdh.error")
    : undefined;
  if (family === undefined)
    return (
      <p className="tw-text-sm tw-text-iron-300">
        {t(locale, "collect.lowest.selectCollection")}
      </p>
    );
  const submit = (value: CollectGoalDraft) => {
    if (!profile?.id) return;
    const validBudget = isPositiveEthAmount(value.budgetEth);
    setBudgetError(!validBudget);
    if (!validBudget) return;
    const valid =
      isAddress(recipient) && recipient.toLowerCase() !== zeroAddress;
    setRecipientError(!valid);
    if (!valid) return;
    const horizon = Object.values(
      ApiCollectTdhRankingRequestHorizonDaysEnum
    ).find(
      (option) =>
        typeof option === "number" && String(option) === value.horizonDays
    );
    if (typeof horizon !== "number") return;
    compare.mutate({
      request: {
        profile_id: profile.id,
        family,
        recipient,
        horizon_days: horizon,
      },
      budgetWei: parseEther(value.budgetEth).toString(),
    });
  };
  return (
    <div className="tw-space-y-5">
      <CollectGoalForm
        draft={draft}
        definitions={[]}
        profile={
          profile?.id
            ? { id: profile.id, displayName: profile.handle ?? profile.display }
            : null
        }
        loading={compare.isPending}
        error={
          budgetError ? t(locale, "collect.goal.invalidBudget") : requestError
        }
        onChange={(value) => {
          setBudgetError(false);
          setDraft(value);
          compare.reset();
        }}
        onSubmit={submit}
        onConnect={onConnect}
      />
      <fieldset
        disabled={compare.isPending}
        className="tw-m-0 tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4"
      >
        <CollectRecipientPicker
          profile={profile}
          value={recipient}
          invalid={recipientError}
          errorId="collect-tdh-recipient-error"
          onChange={(value) => {
            setRecipient(value);
            compare.reset();
            setRecipientError(false);
          }}
        />
        {recipientError && (
          <p
            role="alert"
            id="collect-tdh-recipient-error"
            className="tw-text-sm tw-text-red"
          >
            {t(locale, "collect.trade.invalid.recipient")}
          </p>
        )}
      </fieldset>
      {compare.data &&
        compare.data.ranking.account.profile_id === profile?.id && (
          <TdhResults
            ranking={compare.data.ranking}
            budgetWei={compare.data.budgetWei}
            locale={locale}
          />
        )}
    </div>
  );
}
