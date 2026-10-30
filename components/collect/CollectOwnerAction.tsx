"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { createFetchDeadline } from "@/lib/fetch/fetchDeadline";
import { fetchCollectAssetOwnership } from "@/services/api/collect-api";
import { useQuery } from "@tanstack/react-query";
import { useId, useState, type ReactNode } from "react";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { COLLECT_SECONDARY_ACTION_CLASS } from "./collect-action.styles";
import { useConfirmedMarketPurchases } from "./market-activity-store";
import { collectOwnerRefreshInterval } from "./collect-owner-refresh";

export interface CollectOwnerActionPresentation {
  readonly onSelect?: (trigger: HTMLButtonElement) => void;
  readonly disabledReason?: string;
  readonly descriptionId?: string;
}

export type CollectOwnerActionRenderer = (
  action: CollectOwnerActionPresentation | null,
  feedback: ReactNode
) => ReactNode;

export default function CollectOwnerAction({
  assetKey,
  onList,
  className = "",
  renderAction,
}: {
  readonly assetKey: string;
  readonly onList: (trigger: HTMLButtonElement) => void;
  readonly className?: string;
  readonly renderAction?: CollectOwnerActionRenderer;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const connection = useSeizeConnectContext();
  const [chooseOwner, setChooseOwner] = useState(false);
  const ownershipStatusId = useId();
  const profileId = connectedProfile?.id;
  const purchases = useConfirmedMarketPurchases(profileId);
  const wallets = collectProfileWallets(connectedProfile);
  const membership = wallets
    .map((wallet) => wallet.wallet.toLowerCase())
    .sort((a, b) => a.localeCompare(b))
    .join(":");
  const ownership = useQuery({
    queryKey: [
      QueryKey.COLLECT_ANALYSIS,
      "owner",
      connectedProfile?.id,
      membership,
      assetKey,
    ],
    queryFn: async ({ signal }) => {
      if (!profileId) throw new Error("COLLECT_PROFILE_REQUIRED");
      const deadline = createFetchDeadline(
        signal,
        30_000,
        () => new Error("COLLECT_OWNERSHIP_TIMEOUT")
      );
      try {
        return await deadline.run(() =>
          fetchCollectAssetOwnership(profileId, assetKey, deadline.signal)
        );
      } finally {
        deadline.dispose();
      }
    },
    enabled: Boolean(profileId && wallets.length > 0),
    staleTime: 15_000,
    refetchInterval: (query) =>
      collectOwnerRefreshInterval({
        assetKey,
        profileId,
        purchases,
        analysis: query.state.data,
      }),
  });
  if (!connectedProfile?.id) {
    if (renderAction)
      return renderAction({ onSelect: connection.seizeConnect }, null);
    return (
      <button
        type="button"
        className={`${COLLECT_SECONDARY_ACTION_CLASS} ${className}`}
        onClick={connection.seizeConnect}
      >
        {t(locale, "collect.menu.list")}
      </button>
    );
  }
  const checkingOwnership =
    ownership.isPending || (ownership.isError && ownership.isFetching);
  if (wallets.length > 0 && (checkingOwnership || ownership.isError)) {
    const disabledReason = t(
      locale,
      checkingOwnership
        ? "collect.list.checkingOwnership"
        : "collect.list.ownershipError"
    );
    const feedback = (
      <>
        <span
          id={ownershipStatusId}
          role="status"
          className="tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {disabledReason}
        </span>
        {ownership.isError && (
          <button
            type="button"
            className={COLLECT_SECONDARY_ACTION_CLASS}
            disabled={checkingOwnership}
            aria-label={t(locale, "collect.list.retryOwnership")}
            onClick={() => void ownership.refetch()}
          >
            {t(locale, "collect.retry")}
          </button>
        )}
      </>
    );
    if (renderAction)
      return renderAction(
        { disabledReason, descriptionId: ownershipStatusId },
        feedback
      );
    return (
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
        <button
          type="button"
          className={`${COLLECT_SECONDARY_ACTION_CLASS} ${className}`}
          disabled
          aria-describedby={ownershipStatusId}
        >
          {t(locale, "collect.menu.list")}
        </button>
        {feedback}
      </div>
    );
  }
  const analysis = ownership.data;
  const owned =
    analysis?.account.profile_id === connectedProfile.id
      ? wallets.filter((wallet) =>
          analysis.requirements.some((requirement) =>
            requirement.holdings.some(
              (holding) =>
                holding.asset_key === assetKey &&
                holding.wallet.toLowerCase() === wallet.wallet.toLowerCase() &&
                /^[1-9][0-9]{0,77}$/.test(holding.quantity)
            )
          )
        )
      : [];
  if (owned.length === 0) return renderAction ? renderAction(null, null) : null;
  const canList = owned.some(
    (wallet) =>
      wallet.wallet.toLowerCase() === connection.address?.toLowerCase()
  );
  const selectList = (trigger: HTMLButtonElement) => {
    if (canList) onList(trigger);
    else setChooseOwner((value) => !value);
  };
  const ownerOptions = chooseOwner && !canList && (
    <div className="tw-space-y-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-p-3">
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
        {t(locale, "collect.list.chooseOwner")}
      </p>
      {owned.map((wallet) => (
        <button
          key={wallet.wallet}
          type="button"
          className="tw-block tw-min-h-11 tw-w-full tw-break-all tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-xs tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          onClick={() => {
            if (
              connection.connectedAccounts.some(
                (account) =>
                  account.address.toLowerCase() === wallet.wallet.toLowerCase()
              )
            )
              connection.seizeSwitchConnectedAccount(wallet.wallet);
            else connection.seizeConnect();
          }}
        >
          <span className="tw-block">{wallet.display}</span>
          <span className="tw-block tw-font-mono tw-text-iron-400">
            {wallet.wallet}
          </span>
        </button>
      ))}
    </div>
  );
  if (renderAction) return renderAction({ onSelect: selectList }, ownerOptions);
  return (
    <div>
      <button
        type="button"
        className={`${COLLECT_SECONDARY_ACTION_CLASS} ${className}`}
        onClick={(event) => selectList(event.currentTarget)}
      >
        {t(locale, "collect.menu.list")}
      </button>
      {ownerOptions}
    </div>
  );
}
