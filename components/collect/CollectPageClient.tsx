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
import { useEffect, useState, type ReactNode } from "react";
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
import CollectTdhWorkspace from "./CollectTdhWorkspace";
import CollectPlanBasket from "./CollectPlanBasket";
import CollectPageView, { COLLECT_INTENTS } from "./CollectPageView";
import CollectTradeController from "./CollectTradeController";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { collectLowestArtworkEntries } from "./collect-catalog.helpers";

export default function CollectPageClient() {
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const membership = collectProfileWallets(connectedProfile)
    .map((wallet) => wallet.wallet.toLowerCase())
    .sort()
    .join(":");
  return (
    <CollectCatalogController
      key={`${connectedProfile?.id ?? "public"}:${membership}`}
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
  const [listingTime, setListingTime] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const timer = globalThis.setInterval(
      () => setListingTime(Date.now() / 1000),
      15_000
    );
    return () => globalThis.clearInterval(timer);
  }, []);
  const router = useRouter();
  const params = new URLSearchParams(queryString);
  const collection: CollectCollection =
    Object.values(ApiCollectFamily).find(
      (item) => item.toString() === params.get("collection")
    ) ?? "memes";
  const intent: CollectIntent =
    COLLECT_INTENTS.find((item) => item === params.get("intent")) ?? "full_set";
  const tdhProjection = intent === "tdh" && params.get("view") === "projection";
  const explicitDefinition = params.get("definition");
  let fullSetDefinition = collection === "gradients" ? "gradients" : "memes";
  if (explicitDefinition === "memes" || explicitDefinition === "gradients")
    fullSetDefinition = explicitDefinition;
  const definitionId =
    intent === "full_set" ? fullSetDefinition : (explicitDefinition ?? "");
  const routeGoal = JSON.stringify([intent, collection, definitionId]);
  const [goalState, setGoalState] = useState<{
    routeGoal: string;
    revision: number;
    draft: CollectGoalDraft;
  }>(() => ({
    routeGoal,
    revision: 0,
    draft: {
      intent,
      definitionId,
      targetCount: "1",
      budgetEth: "",
      horizonDays: "30",
      includeCollaborations: true,
    } satisfies CollectGoalDraft,
  }));
  if (goalState.routeGoal !== routeGoal) {
    setGoalState({
      routeGoal,
      revision: goalState.revision + 1,
      draft: { ...goalState.draft, intent, definitionId },
    });
  }
  const goalDraft = goalState.draft;
  const setGoalDraft = (draft: CollectGoalDraft) =>
    setGoalState((current) => ({
      ...current,
      draft,
      revision: current.revision + 1,
    }));
  const [storedCostPlan, setStoredCostPlan] = useState<{
    revision: number;
    plan: ApiCollectPlan;
  } | null>(null);
  const costPlan =
    storedCostPlan?.revision === goalState.revision
      ? storedCostPlan.plan
      : null;
  const setCostPlan = (plan: ApiCollectPlan | null) =>
    setStoredCostPlan(plan ? { revision: goalState.revision, plan } : null);
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
    enabled: intent === "lowest" || intent === "tdh",
  });
  const discovery = useCollectCatalog(collection, intent);
  const visibleEntries =
    intent === "lowest"
      ? collectLowestArtworkEntries(
          discovery.entries,
          collectProfileWallets(connectedProfile).map(
            (wallet) => wallet.wallet
          ),
          listingTime
        )
      : discovery.entries;
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
      items: visibleEntries.map((entry) =>
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
  let completionCollection: CollectCollection =
    fullSetDefinition === "gradients" ? "gradients" : "memes";
  if (intent === "pebbles_set") completionCollection = "pebbles";
  else if (intent === "season" || intent === "artist")
    completionCollection = "memes";
  const changeCollection = (value: CollectCollection) => {
    const patch: Record<string, string> = {
      collection: value,
      token: "",
      q: "",
    };
    if (["season", "full_set", "artist", "pebbles_set"].includes(intent)) {
      if (value === completionCollection) return;
      patch["definition"] = "";
      if (value === "pebbles") patch["intent"] = "pebbles_set";
      else if (value === "gradients" || intent === "pebbles_set")
        patch["intent"] = "full_set";
    }
    updateQuery(patch);
  };
  const changeIntent = (value: CollectIntent) => {
    const patch: Record<string, string> = {
      intent: value,
      definition: "",
      view: "",
    };
    if (
      ["season", "full_set", "artist", "pebbles_set", "tdh"].includes(value)
    ) {
      patch["token"] = "";
      patch["q"] = "";
    }
    switch (value) {
      case "season":
      case "artist":
      case "tdh":
        patch["collection"] = "memes";
        break;
      case "full_set":
        patch["collection"] =
          completionCollection === "gradients" ? "gradients" : "memes";
        break;
      case "pebbles_set":
        patch["collection"] = "pebbles";
        break;
      case "lowest":
      case "explore":
      case "specific":
        break;
    }
    updateQuery(patch);
  };
  let goalContent: ReactNode;
  if (["season", "full_set", "artist", "pebbles_set"].includes(intent))
    goalContent = (
      <CollectGoalsController
        draft={goalDraft}
        revision={goalState.revision}
        catalog={catalog.data}
        profile={connectedProfile}
        completion={{
          collection: completionCollection,
          onCollectionChange: changeCollection,
          onIntentChange: changeIntent,
        }}
        onChange={setGoalDraft}
        onPlan={setCostPlan}
        onConnect={connect}
      />
    );
  else if (intent === "tdh")
    goalContent = (
      <CollectTdhWorkspace
        collection={collection}
        profile={connectedProfile}
        snapshot={discovery.tdhSnapshot}
        projection={tdhProjection}
        onToggleProjection={() =>
          updateQuery({ view: tdhProjection ? "" : "projection" })
        }
        onConnect={connect}
      />
    );
  else if (intent === "lowest")
    goalContent = (
      <p className="tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "collect.lowest.scope")}
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
        goalContent={goalContent}
        showListings={
          intent === "lowest" || (intent === "tdh" && !tdhProjection)
        }
        onCollectionChange={changeCollection}
        onIntentChange={changeIntent}
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
