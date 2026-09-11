"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  fetchCollectCapabilities,
  fetchCollectCatalog,
} from "@/services/api/collect-api";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import type {
  CollectCatalogView,
  CollectCollection,
  CollectGoalDraft,
  CollectIntent,
  CollectTradeAction,
} from "./collect.types";
import { collectCatalogArtwork } from "./collect-catalog.adapters";
import { collectCostPlanView } from "./collect-plan.adapters";
import { collectCatalogEntryId, useCollectCatalog } from "./useCollectCatalog";
import CollectGoalsController from "./CollectGoalsController";
import CollectTdhController from "./CollectTdhController";
import CollectPlanBasket from "./CollectPlanBasket";
import CollectPageView, { COLLECT_INTENTS } from "./CollectPageView";
import CollectTradeController from "./CollectTradeController";

export default function CollectPageClient() {
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const membership =
    connectedProfile?.wallets
      ?.map((wallet) => wallet.wallet.toLowerCase())
      .sort()
      .join(":") ?? "public";
  return (
    <CollectCatalogController
      key={`${searchParams.toString()}:${connectedProfile?.id ?? "public"}:${membership}`}
      queryString={searchParams.toString()}
    />
  );
}

function CollectCatalogController({
  queryString,
}: {
  readonly queryString: string;
}) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const params = new URLSearchParams(queryString);
  const collection: CollectCollection =
    Object.values(ApiCollectFamily).find(
      (item) => item.toString() === params.get("collection")
    ) ?? "all";
  const intent: CollectIntent =
    COLLECT_INTENTS.find((item) => item === params.get("intent")) ?? "explore";
  const initialSearch = (params.get("token") ?? params.get("q") ?? "").slice(
    0,
    100
  );
  const [search, setSearch] = useState(initialSearch);
  const [goalDraft, setGoalDraft] = useState<CollectGoalDraft>({
    intent,
    definitionId:
      params.get("definition") ?? (intent === "full_set" ? "memes" : ""),
    targetCount: "1",
    budgetEth: "",
    horizonDays: "30",
    includeCollaborations: true,
  });
  const [costPlan, setCostPlan] = useState<ApiCollectPlan | null>(null);
  const [basketOpen, setBasketOpen] = useState(false);
  const [trade, setTrade] = useState<{
    asset: ApiCollectAsset;
    action: CollectTradeAction;
    order?: ApiMarketTradeOrder;
    quantity?: string;
    recipient?: string;
  } | null>(null);
  const { connectedProfile, requestAuth } = useAuth();
  const { seizeConnect } = useSeizeConnectContext();
  const profile = connectedProfile?.id
    ? {
        id: connectedProfile.id,
        displayName: connectedProfile.handle ?? connectedProfile.display,
      }
    : null;
  const connect = () => {
    if (connectedProfile) void requestAuth();
    else seizeConnect();
  };
  const catalog = useQuery({
    queryKey: [QueryKey.COLLECT_CATALOG],
    queryFn: ({ signal }) => fetchCollectCatalog(signal),
    staleTime: 60_000,
  });
  const capabilities = useQuery({
    queryKey: [QueryKey.COLLECT_CAPABILITIES],
    queryFn: ({ signal }) => fetchCollectCapabilities(signal),
    staleTime: 15_000,
  });
  const discovery = useCollectCatalog(collection, initialSearch, intent);
  const plan =
    costPlan && profile
      ? collectCostPlanView(
          costPlan,
          profile,
          t(locale, `collect.intent.${intent}`),
          locale
        )
      : null;
  let catalogView: CollectCatalogView;
  if (discovery.pending) catalogView = { status: "loading" };
  else if (discovery.failed)
    catalogView = {
      status: "error",
      message: t(locale, "collect.error.catalog"),
    };
  else
    catalogView = {
      status: "ready",
      hasMore: discovery.hasMore,
      loadingMore: discovery.loadingMore,
      items: discovery.entries.map((entry) =>
        collectCatalogArtwork(entry, catalog.data, capabilities.data, locale)
      ),
    };
  const updateQuery = (patch: Readonly<Record<string, string>>) => {
    const next = new URLSearchParams(queryString);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/collect?${next.toString()}`, { scroll: false });
  };
  let goalContent: ReactNode;
  if (["season", "full_set", "artist", "pebbles_set"].includes(intent))
    goalContent = (
      <CollectGoalsController
        draft={goalDraft}
        catalog={catalog.data}
        profile={connectedProfile}
        onChange={setGoalDraft}
        onPlan={setCostPlan}
        onConnect={connect}
      />
    );
  else if (intent === "tdh")
    goalContent = (
      <CollectTdhController
        collection={collection}
        profile={connectedProfile}
        onConnect={connect}
      />
    );
  else if (intent === "lowest")
    goalContent = (
      <p className="tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          locale,
          collection === "all"
            ? "collect.lowest.selectCollection"
            : "collect.lowest.scope"
        )}
      </p>
    );
  return (
    <>
      <CollectPageView
        catalog={catalogView}
        collection={collection}
        intent={intent}
        profile={profile}
        plan={plan}
        search={search}
        goalContent={goalContent}
        onCollectionChange={(value) =>
          updateQuery({ collection: value, token: "" })
        }
        onIntentChange={(value) =>
          updateQuery({
            intent: value,
            definition: "",
            ...((value === "lowest" || value === "tdh") && collection === "all"
              ? { collection: "memes" }
              : {}),
          })
        }
        onSearchChange={setSearch}
        onSearch={() =>
          updateQuery({
            q: search.trim().slice(0, 100),
            token: "",
            ...(intent === "lowest" ? { intent: "specific" } : {}),
          })
        }
        onConnect={connect}
        onRetry={discovery.retry}
        onLoadMore={discovery.loadMore}
        onTrade={(id, action) => {
          const entry = discovery.entries.find(
            (item) => collectCatalogEntryId(item) === id
          );
          if (entry)
            setTrade({
              asset: entry.asset,
              action,
              ...(action === "buy" && entry.order
                ? { order: entry.order }
                : {}),
            });
        }}
        onReviewPlan={(id, revision) => {
          if (costPlan?.id === id && costPlan.revision === revision)
            setBasketOpen(true);
        }}
      />
      {basketOpen && costPlan && (
        <CollectPlanBasket
          plan={costPlan}
          onClose={() => setBasketOpen(false)}
          onPurchase={(asset, order, quantity, recipient) => {
            setBasketOpen(false);
            setTrade({ asset, order, quantity, recipient, action: "buy" });
          }}
        />
      )}
      {trade && (
        <CollectTradeController
          key={`${profile?.id ?? "public"}:${trade.asset.asset_key}:${trade.action}`}
          asset={trade.asset}
          action={trade.action}
          {...(trade.order ? { initialOrder: trade.order } : {})}
          {...(trade.quantity ? { initialQuantity: trade.quantity } : {})}
          {...(trade.recipient ? { initialRecipient: trade.recipient } : {})}
          onClose={() => setTrade(null)}
          onSettled={() => setCostPlan(null)}
        />
      )}
    </>
  );
}
