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
import {
  lazy,
  Suspense,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { collectAssetIdentity } from "./collect.adapters";
import type {
  CollectActionView,
  CollectTradeCollection,
  CollectTradeAction,
} from "./collect.types";
import CollectTradeActions from "./CollectTradeActions";
import { CollectTradeDialog } from "./CollectTradeSheet";
import CollectOwnerAction from "./CollectOwnerAction";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { COLLECT_SECONDARY_ACTION_CLASS } from "./collect-action.styles";
import {
  MEMES_CONTRACT,
  MEMELAB_CONTRACT,
  GRADIENT_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import { revealMarketDepth } from "@/components/nft-market-depth/market-depth-disclosure";
import CollectDetailActionRow, {
  CollectDetailLayout,
} from "./CollectDetailActionRow";
import CollectDetailLoading from "./CollectDetailLoading";
import CollectDetailSupportingActions from "./CollectDetailSupportingActions";
import CollectDetailPanel from "./CollectDetailPanel";
import CollectMarketButton from "./CollectMarketButton";

const CollectTradeController = lazy(() => import("./CollectTradeController"));
const MAX_DETAIL_LOOKUP_PAGES = 100;
const ACTIONS: readonly CollectActionView[] = [{ action: "accept" }];
const OFFER_MESSAGE_KEY = "collect.menu.offer" as const;

interface CollectDetailActionsProps {
  readonly collection: CollectTradeCollection;
  readonly tokenId: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly onMarketChange?: () => void;
  readonly mobileSticky?: boolean;
  readonly hideMarketLink?: boolean;
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

function collectFamily(collection: CollectTradeCollection) {
  return {
    memes: ApiCollectFamily.Memes,
    memelab: ApiCollectFamily.Memelab,
    gradients: ApiCollectFamily.Gradients,
    pebbles: ApiCollectFamily.Pebbles,
  }[collection];
}

function useCollectDetailAsset(
  collection: CollectTradeCollection,
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
  renderSupportingActions,
}: Omit<CollectDetailActionsProps, "title"> & {
  readonly action: CollectTradeAction;
  readonly onClose: () => void;
  readonly inlineBuy?: boolean;
  readonly renderSecondaryActions?: (assetKey: string | undefined) => ReactNode;
  readonly renderSupportingActions?: (
    assetKey: string | undefined
  ) => ReactNode;
}) {
  const detailLayout = useContext(CollectDetailLayout);
  const loading =
    inlineBuy && detailLayout ? (
      <CollectDetailLoading locale={locale} />
    ) : (
      <PendingTrade locale={locale} />
    );
  const lookup = useCollectDetailAsset(collection, tokenId);
  const secondaryActions = renderSecondaryActions?.(lookup.data?.asset_key);
  const supportingActions = renderSupportingActions?.(lookup.data?.asset_key);
  if (lookup.isPending) return loading;
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
    <Suspense fallback={loading}>
      <CollectTradeController
        presentation="contents"
        layout={inlineBuy ? "inline-buy" : "standard"}
        asset={lookup.data}
        action={action}
        onClose={onClose}
        {...(inlineBuy && Boolean(secondaryActions)
          ? { secondaryActions }
          : {})}
        {...(inlineBuy && Boolean(supportingActions)
          ? { supportingActions }
          : {})}
        {...(onMarketChange ? { onMarketChange } : {})}
      />
    </Suspense>
  );
}

function DetailActions(props: CollectDetailActionsProps) {
  const viewMarket = props.hideMarketLink ? null : (
    <CollectMarketButton
      locale={props.locale}
      mobileRow={props.mobileSticky ?? false}
      onClick={() =>
        revealMarketDepth(
          {
            memes: MEMES_CONTRACT,
            memelab: MEMELAB_CONTRACT,
            gradients: GRADIENT_CONTRACT,
            pebbles: NEXTGEN_CONTRACT,
          }[props.collection],
          props.tokenId
        )
      }
    />
  );
  const inlineLookup = useCollectDetailAsset(props.collection, props.tokenId);
  const hideFallbackActions =
    inlineLookup.data !== undefined ||
    (Boolean(props.mobileSticky) && inlineLookup.isPending);
  const [action, setAction] = useState<CollectTradeAction | null>(null);
  const [purchaseSession, setPurchaseSession] = useState(0);
  const opener = useRef<HTMLButtonElement | null>(null);
  const visibleOffer = useRef<HTMLButtonElement | null>(null);
  const setVisibleOffer = useCallback((node: HTMLButtonElement | null) => {
    visibleOffer.current = node;
    // Loading can replace the fallback opener after the dialog has closed.
    if (
      node &&
      opener.current === document.activeElement &&
      opener.current?.closest("[hidden]")
    ) {
      node.focus({ preventScroll: true });
    }
  }, []);
  const close = () => {
    const trigger = opener.current;
    setAction(null);
    // Restore after the dialog's unmount focus cleanup, including on touch layouts.
    requestAnimationFrame(() => {
      const target =
        trigger?.closest("[hidden]") === null ? trigger : visibleOffer.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
    });
  };
  const renderSupportingActions = (assetKey: string | undefined) => {
    if (props.mobileSticky)
      return (
        <CollectDetailSupportingActions
          assetKey={assetKey}
          title={props.title}
          locale={props.locale}
          onTrade={(nextAction, trigger) => {
            opener.current = trigger;
            setAction(nextAction);
          }}
        />
      );
    const ownerAction = assetKey && (
      <div data-collect-owner-action>
        <CollectOwnerAction
          assetKey={assetKey}
          onList={(trigger) => {
            opener.current = trigger;
            setAction("list");
          }}
        />
      </div>
    );
    const reviewAction = (
      <CollectTradeActions
        actions={ACTIONS}
        title={props.title}
        locale={props.locale}
        onTrade={(nextAction, trigger) => {
          opener.current = trigger;
          setAction(nextAction);
        }}
      />
    );
    return (
      <>
        {ownerAction}
        {reviewAction}
      </>
    );
  };
  return (
    <CollectDetailPanel framed={props.mobileSticky ?? false}>
      <CollectDetailLayout.Provider
        value={
          props.mobileSticky
            ? {
                marketLink: viewMarket,
                offerAction: (
                  <button
                    type="button"
                    aria-label={t(props.locale, "collect.actionFor", {
                      action: t(props.locale, OFFER_MESSAGE_KEY),
                      title: props.title,
                    })}
                    className={COLLECT_SECONDARY_ACTION_CLASS}
                    onClick={(event) => {
                      opener.current = event.currentTarget;
                      setAction("offer");
                    }}
                  >
                    {t(props.locale, OFFER_MESSAGE_KEY)}
                  </button>
                ),
              }
            : null
        }
      >
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
                ref={setVisibleOffer}
                type="button"
                aria-label={t(props.locale, "collect.actionFor", {
                  action: t(props.locale, OFFER_MESSAGE_KEY),
                  title: props.title,
                })}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setAction("offer");
                }}
                className={COLLECT_SECONDARY_ACTION_CLASS}
              >
                {t(props.locale, OFFER_MESSAGE_KEY)}
              </button>
              {!props.mobileSticky && renderSupportingActions(assetKey)}
            </>
          )}
          {...(props.mobileSticky ? { renderSupportingActions } : {})}
          {...(props.onMarketChange
            ? { onMarketChange: props.onMarketChange }
            : {})}
        />
        <div
          hidden={hideFallbackActions}
          className={hideFallbackActions ? "tw-hidden" : ""}
        >
          <CollectDetailActionRow active={!hideFallbackActions}>
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
              className={COLLECT_SECONDARY_ACTION_CLASS}
            >
              {t(props.locale, OFFER_MESSAGE_KEY)}
            </button>
            <div data-collect-detail-other-actions className="tw-contents">
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
          </CollectDetailActionRow>
        </div>
      </CollectDetailLayout.Provider>
      {viewMarket && (
        <div
          data-collect-market-link
          className={props.mobileSticky ? "tw-mt-1 max-sm:tw-mt-2" : "tw-mt-1"}
        >
          {viewMarket}
        </div>
      )}
      {action && (
        <CollectTradeDialog
          open
          title={props.title}
          onClose={close}
          fixedHeight={action === "accept"}
        >
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
    </CollectDetailPanel>
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
