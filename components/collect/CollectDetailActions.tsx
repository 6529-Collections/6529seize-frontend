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
import type { ReactNode } from "react";
import { collectAssetIdentity } from "./collect.adapters";
import type {
  CollectActionView,
  CollectCollection,
  CollectTradeAction,
} from "./collect.types";
import CollectTradeActions from "./CollectTradeActions";
import { CollectTradeDialog } from "./CollectTradeSheet";
import CollectOwnerAction from "./CollectOwnerAction";
import { collectProfileWallets } from "./collect-recipient.helpers";

const CollectTradeController = lazy(() => import("./CollectTradeController"));
const MAX_DETAIL_LOOKUP_PAGES = 100;
const ACTIONS: readonly CollectActionView[] = [{ action: "accept" }];
const OFFER_MESSAGE_KEY = "collect.menu.offer" as const;
const ACTION_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-text-sm tw-font-medium tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-white";

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

function PendingTrade({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-px-4 md:tw-px-6">
      <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-400">
        {t(locale, "collect.detail.loading")}
      </p>
    </div>
  );
}

function collectFamily(collection: Exclude<CollectCollection, "all">) {
  return {
    memes: ApiCollectFamily.Memes,
    gradients: ApiCollectFamily.Gradients,
    pebbles: ApiCollectFamily.Pebbles,
  }[collection];
}

function useCollectDetailAsset(
  collection: Exclude<CollectCollection, "all">,
  tokenId: string
) {
  const family = collectFamily(collection);
  return useQuery({
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
}

function DetailTrade({
  collection,
  tokenId,
  locale,
  action,
  onClose,
  onMarketChange,
  inlineBuy = false,
  renderSecondaryActions,
}: Omit<CollectDetailActionsProps, "title"> & {
  readonly action: CollectTradeAction;
  readonly onClose: () => void;
  readonly inlineBuy?: boolean;
  readonly renderSecondaryActions?: (assetKey: string | undefined) => ReactNode;
}) {
  const lookup = useCollectDetailAsset(collection, tokenId);
  const secondaryActions = renderSecondaryActions?.(lookup.data?.asset_key);
  if (lookup.isPending)
    return (
      <div className="tw-w-full tw-space-y-3">
        <PendingTrade locale={locale} />
      </div>
    );
  if (lookup.isError)
    return (
      <div className="tw-space-y-2 tw-px-4 md:tw-px-6">
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
        </div>
      </div>
    );
  return (
    <Suspense fallback={<PendingTrade locale={locale} />}>
      <CollectTradeController
        presentation="contents"
        layout={inlineBuy ? "inline-buy" : "standard"}
        asset={lookup.data}
        action={action}
        onClose={onClose}
        {...(inlineBuy && Boolean(secondaryActions)
          ? { secondaryActions }
          : {})}
        {...(onMarketChange ? { onMarketChange } : {})}
      />
    </Suspense>
  );
}

function DetailActions(props: CollectDetailActionsProps) {
  const inlineLookup = useCollectDetailAsset(props.collection, props.tokenId);
  const [action, setAction] = useState<CollectTradeAction | null>(null);
  const [purchaseSession, setPurchaseSession] = useState(0);
  const opener = useRef<HTMLButtonElement | null>(null);
  const visibleOffer = useRef<HTMLButtonElement | null>(null);
  const close = () => {
    const trigger = opener.current;
    setAction(null);
    queueMicrotask(() => {
      const target =
        trigger?.closest("[hidden]") === null ? trigger : visibleOffer.current;
      if (target?.isConnected) target.focus();
    });
  };
  return (
    <div className="tw-w-full">
      <DetailTrade
        key={purchaseSession}
        collection={props.collection}
        tokenId={props.tokenId}
        locale={props.locale}
        action="buy"
        inlineBuy
        onClose={() => setPurchaseSession((value) => value + 1)}
        renderSecondaryActions={(assetKey) => (
          <>
            <button
              ref={visibleOffer}
              type="button"
              aria-label={t(props.locale, "collect.actionFor", {
                action: t(props.locale, OFFER_MESSAGE_KEY),
                title: props.title,
              })}
              onClick={(event) => {
                opener.current = event.currentTarget;
                setAction("offer");
              }}
              className={ACTION_CLASS}
            >
              {t(props.locale, OFFER_MESSAGE_KEY)}
            </button>
            {assetKey && (
              <CollectOwnerAction
                assetKey={assetKey}
                onList={(trigger) => {
                  opener.current = trigger;
                  setAction("list");
                }}
              />
            )}
            <CollectTradeActions
              actions={ACTIONS}
              title={props.title}
              locale={props.locale}
              onTrade={(nextAction, trigger) => {
                opener.current = trigger;
                setAction(nextAction);
              }}
            />
          </>
        )}
        {...(props.onMarketChange
          ? { onMarketChange: props.onMarketChange }
          : {})}
      />
      <div
        hidden={inlineLookup.data !== undefined}
        className={
          inlineLookup.data === undefined
            ? "tw-flex tw-flex-wrap tw-items-center tw-gap-2"
            : "tw-hidden"
        }
      >
        <button
          type="button"
          aria-label={t(props.locale, "collect.actionFor", {
            action: t(props.locale, OFFER_MESSAGE_KEY),
            title: props.title,
          })}
          onClick={(event) => {
            opener.current = event.currentTarget;
            setAction("offer");
          }}
          className={ACTION_CLASS}
        >
          {t(props.locale, OFFER_MESSAGE_KEY)}
        </button>
        <CollectTradeActions
          actions={ACTIONS}
          title={props.title}
          locale={props.locale}
          onTrade={(nextAction, trigger) => {
            opener.current = trigger;
            setAction(nextAction);
          }}
        />
      </div>
      {action && (
        <CollectTradeDialog open title={props.title} onClose={close}>
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
        </CollectTradeDialog>
      )}
    </div>
  );
}

function ProfileDetailActions(props: CollectDetailActionsProps) {
  const { connectedProfile } = useAuth();
  const membership = collectProfileWallets(connectedProfile)
    .map((wallet) => wallet.wallet.toLowerCase())
    .sort((left, right) => left.localeCompare(right))
    .join(":");
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
