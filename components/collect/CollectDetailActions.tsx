"use client";

import { useAuth } from "@/components/auth/Auth";
import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchCollectAssets } from "@/services/api/collect-api";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useRef, useState } from "react";
import { collectAssetIdentity } from "./collect.adapters";
import type {
  CollectActionView,
  CollectCollection,
  CollectTradeAction,
} from "./collect.types";
import CollectTradeActions from "./CollectTradeActions";

const CollectTradeController = lazy(() => import("./CollectTradeController"));
const MAX_DETAIL_LOOKUP_PAGES = 100;
const ACTIONS: readonly CollectActionView[] = [
  { action: "buy" },
  { action: "offer" },
  { action: "list" },
  { action: "accept" },
];

interface CollectDetailActionsProps {
  readonly collection: Exclude<CollectCollection, "all">;
  readonly tokenId: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly onMarketChange?: () => void;
}

function isExactAsset(
  asset: ApiCollectAsset,
  family: ApiCollectFamily,
  tokenId: string
): boolean {
  const identity = collectAssetIdentity(asset.asset_key);
  return (
    identity?.family === family &&
    identity.tokenId === tokenId &&
    asset.family === family &&
    asset.token_id === tokenId &&
    asset.chain_id === 1 &&
    asset.asset_key === `1:${asset.contract.toLowerCase()}:${tokenId}`
  );
}

function PendingTrade({
  locale,
  onClose,
}: {
  readonly locale: SupportedLocale;
  readonly onClose: () => void;
}) {
  return (
    <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-400">
        {t(locale, "collect.detail.loading")}
      </p>
      <Button variant="tertiary" size="sm" onClick={onClose}>
        {t(locale, "collect.trade.close")}
      </Button>
    </div>
  );
}

function DetailTrade({
  collection,
  tokenId,
  locale,
  action,
  onClose,
  onMarketChange,
}: Omit<CollectDetailActionsProps, "title"> & {
  readonly action: CollectTradeAction;
  readonly onClose: () => void;
}) {
  const family = {
    memes: ApiCollectFamily.Memes,
    gradients: ApiCollectFamily.Gradients,
    pebbles: ApiCollectFamily.Pebbles,
  }[collection];
  const lookup = useQuery({
    queryKey: [QueryKey.COLLECT_ASSETS, "detail", family, tokenId],
    queryFn: async ({ signal }) => {
      const inspected = new Set<string>();
      // Numeric searches also match artwork names, so the exact token can be
      // after the first page. Keep lookup bounded and cancellable throughout.
      for (
        let pageNumber = 1;
        pageNumber <= MAX_DETAIL_LOOKUP_PAGES;
        pageNumber++
      ) {
        signal.throwIfAborted();
        const page = await fetchCollectAssets({
          family,
          query: tokenId,
          page: pageNumber,
          signal,
        });
        signal.throwIfAborted();
        const asset = page.data.find((item) =>
          isExactAsset(item, family, tokenId)
        );
        if (asset) return asset;
        const previousCount = inspected.size;
        page.data.forEach((item) => inspected.add(item.asset_key));
        if (
          !page.next ||
          inspected.size === previousCount ||
          inspected.size >= page.count
        )
          break;
      }
      throw new Error("COLLECT_DETAIL_ASSET_UNAVAILABLE");
    },
    retry: false,
    staleTime: 0,
  });
  if (lookup.isPending)
    return <PendingTrade locale={locale} onClose={onClose} />;
  if (lookup.isError)
    return (
      <div className="tw-mt-2 tw-space-y-2">
        <p role="alert" className="tw-m-0 tw-text-xs tw-text-iron-300">
          {t(locale, "collect.detail.unavailable")}
        </p>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void lookup.refetch()}
          >
            {t(locale, "collect.retry")}
          </Button>
          <Button variant="tertiary" size="sm" onClick={onClose}>
            {t(locale, "collect.trade.close")}
          </Button>
        </div>
      </div>
    );
  return (
    <Suspense fallback={<PendingTrade locale={locale} onClose={onClose} />}>
      <CollectTradeController
        asset={lookup.data}
        action={action}
        onClose={onClose}
        {...(onMarketChange ? { onMarketChange } : {})}
      />
    </Suspense>
  );
}

function DetailActions(props: CollectDetailActionsProps) {
  const [action, setAction] = useState<CollectTradeAction | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const close = () => {
    const trigger = opener.current;
    setAction(null);
    queueMicrotask(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  };
  return (
    <div>
      <CollectTradeActions
        actions={ACTIONS}
        title={props.title}
        locale={props.locale}
        onTrade={(nextAction, trigger) => {
          opener.current = trigger;
          setAction(nextAction);
        }}
      />
      {action && (
        <DetailTrade
          key={action}
          collection={props.collection}
          tokenId={props.tokenId}
          locale={props.locale}
          action={action}
          onClose={close}
          {...(props.onMarketChange
            ? { onMarketChange: props.onMarketChange }
            : {})}
        />
      )}
    </div>
  );
}

function ProfileDetailActions(props: CollectDetailActionsProps) {
  const { connectedProfile } = useAuth();
  const membership =
    connectedProfile?.wallets
      ?.map((wallet) => wallet.wallet.toLowerCase())
      .sort()
      .join(":") ?? "public";
  return (
    <DetailActions
      key={`${props.collection}:${props.tokenId}:${connectedProfile?.id ?? "public"}:${membership}`}
      {...props}
    />
  );
}

export default function CollectDetailActions(props: CollectDetailActionsProps) {
  return (
    <NftPurchasingGate>
      <ProfileDetailActions {...props} />
    </NftPurchasingGate>
  );
}
