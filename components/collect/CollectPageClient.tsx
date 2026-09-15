"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  fetchCollectCapabilities,
  fetchCollectCatalog,
} from "@/services/api/collect-api";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CollectCatalogView,
  CollectCollection,
  CollectGoalDraft,
  CollectIntent,
  CollectPlanScenario,
  CollectAcquisitionStrategy,
  CollectTradeAction,
} from "./collect.types";
import { collectCatalogArtwork } from "./collect-catalog.adapters";
import {
  collectCostPlanView,
  collectPlanForScenario,
} from "./collect-plan.adapters";
import { collectCatalogEntryId, useCollectCatalog } from "./useCollectCatalog";
import CollectGoalsController from "./CollectGoalsController";
import CollectTdhWorkspace from "./CollectTdhWorkspace";
import CollectPlanBasket from "./CollectPlanBasket";
import {
  collectPlanReviewFingerprint,
  collectPlanReviewLegs,
} from "./collect-plan-review.helpers";
import {
  collectLocation,
  collectIntentForCollection,
} from "./collect-navigation";
import CollectPageView from "./CollectPageView";
import CollectTradeController from "./CollectTradeController";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { collectLowestArtworkEntries } from "./collect-catalog.helpers";
import CollectSelectionBar from "./CollectSelectionBar";
import CollectBatchController from "./CollectBatchController";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import { collectArtworkSelection } from "./collect-artwork-selection";
import CollectOfferWorkspace from "./CollectOfferWorkspace";
import CollectStrategyPicker from "./CollectStrategyPicker";
import CollectPlanMetadataProvider from "./CollectPlanMetadataProvider";
import type {
  CollectOfferSelection,
  OfferPriceMethod,
} from "./collect-offer-plan.types";
import {
  collectMissingOfferSelection,
  collectSelectedOfferSelection,
} from "./collect-offer-selection.helpers";
import { useCollectPurchaseSelection } from "./useCollectPurchaseSelection";

export default function CollectPageClient() {
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const membership = collectProfileWallets(connectedProfile)
    .map((wallet) => wallet.wallet.toLowerCase())
    .sort((left, right) => left.localeCompare(right))
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
  const { connectedProfile, requestAuth } = useAuth();
  const {
    selection,
    availableSelection,
    setSelection,
    purchases,
    listingTime,
    settlementRevision,
    setSettlementRevision,
    orderIsPending,
    orderIsPendingNow,
    clearSelection,
  } = useCollectPurchaseSelection(connectedProfile?.id);
  const router = useRouter();
  // Compose rapid control changes before App Router commits their URLs. An
  // intermediate local commit must not replace a newer requested destination.
  const requestedNavigation = useRef({
    query: queryString,
    pending: new Set<string>(),
  });
  useLayoutEffect(() => {
    const requested = requestedNavigation.current;
    if (requested.pending.delete(queryString)) {
      if (requested.query === queryString) requested.pending.clear();
    } else {
      requested.query = queryString;
      requested.pending.clear();
    }
  }, [queryString]);
  useEffect(() => {
    const followHistory = () => {
      requestedNavigation.current.query = new URLSearchParams(
        window.location.search
      ).toString();
      requestedNavigation.current.pending.clear();
    };
    window.addEventListener("popstate", followHistory);
    return () => window.removeEventListener("popstate", followHistory);
  }, []);
  const params = new URLSearchParams(queryString);
  const location = collectLocation(queryString);
  const { collection, intent, definitionId } = location;
  const tdhProjection = intent === "tdh" && params.get("view") === "projection";
  useEffect(() => {
    const requested = requestedNavigation.current;
    if (location.query !== queryString && requested.query === queryString) {
      requested.query = location.query;
      requested.pending = new Set([...requested.pending, location.query]);
      router.replace(`/collect?${location.query}`, { scroll: false });
    }
  }, [location.query, queryString, router]);
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
      draft: {
        ...goalState.draft,
        intent,
        definitionId,
        targetCount: collection === "memes" ? goalState.draft.targetCount : "1",
      },
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
  const sourceCostPlan =
    storedCostPlan?.revision === goalState.revision
      ? storedCostPlan.plan
      : null;
  const [scenarioState, setScenarioState] = useState<{
    planId: string;
    scenario: CollectPlanScenario;
  } | null>(null);
  const planScenario =
    scenarioState?.planId === sourceCostPlan?.id
      ? (scenarioState?.scenario ?? "budget")
      : "budget";
  const costPlan = sourceCostPlan
    ? collectPlanForScenario(sourceCostPlan, planScenario)
    : null;
  const planFingerprint = costPlan
    ? collectPlanReviewFingerprint(costPlan)
    : null;
  const currentPlanFingerprint = useRef(planFingerprint);
  useLayoutEffect(() => {
    currentPlanFingerprint.current = planFingerprint;
  }, [planFingerprint]);
  const setCostPlan = (plan: ApiCollectPlan | null) =>
    setStoredCostPlan(plan ? { revision: goalState.revision, plan } : null);
  const invalidateSettledPlans = () => {
    setCostPlan(null);
    setSettlementRevision((revision) => revision + 1);
  };
  // The checkout owns its reviewed source. Refreshing a goal or its holdings
  // must not unmount a transaction that is processing or its finished receipt.
  const [basketPlan, setBasketPlan] = useState<ApiCollectPlan | null>(null);
  const [blendedPurchase, setBlendedPurchase] = useState<{
    fingerprint: string;
    plan: ApiCollectPlan;
    legs: readonly ApiCollectPlanLeg[];
    settled?: boolean;
  } | null>(null);
  const currentBlendedPurchase = useRef(blendedPurchase);
  useLayoutEffect(() => {
    currentBlendedPurchase.current = blendedPurchase;
  }, [blendedPurchase]);
  const [blendedBuyLocks, setBlendedBuyLocks] = useState<readonly string[]>([]);
  const [blendedPurchaseOpen, setBlendedPurchaseOpen] = useState(false);
  const focusResumePurchase = useCallback(
    (button: HTMLButtonElement | null) => {
      button?.focus({ preventScroll: true });
    },
    []
  );
  const [offerWorkspace, setOfferWorkspace] = useState<{
    items: readonly CollectOfferSelection[];
    hasAlternatives: boolean;
    strategy?: CollectAcquisitionStrategy | undefined;
    planFingerprint?: string | null;
    sessionKey: string;
  } | null>(null);
  const strategySession = useRef(0);
  const [offerWorkspaceActive, setOfferWorkspaceActive] = useState(false);
  const offerReturnFocus = useRef<HTMLElement | null>(null);
  const selectionOfferFocus = useRef<"none" | "open" | "pending">("none");
  const setSelectionOfferTrigger = useCallback(
    (button: HTMLButtonElement | null) => {
      if (button && selectionOfferFocus.current === "pending") {
        selectionOfferFocus.current = "none";
        button.focus({ preventScroll: true });
      }
    },
    []
  );
  const openOffers = (
    items: readonly CollectOfferSelection[],
    hasAlternatives = false,
    returnToSelection = false,
    strategy?: CollectAcquisitionStrategy
  ) => {
    if (items.length === 0) return;
    selectionOfferFocus.current = returnToSelection ? "open" : "none";
    offerReturnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (strategy !== undefined || offerWorkspace?.strategy !== undefined)
      strategySession.current += 1;
    setOfferWorkspace({
      items,
      hasAlternatives,
      strategy,
      planFingerprint: strategy ? planFingerprint : null,
      sessionKey: String(strategySession.current),
    });
    setOfferWorkspaceActive(true);
  };
  const closeOffers = () => {
    const returningToSelection =
      selectionOfferFocus.current === "open" && selection.length > 0;
    selectionOfferFocus.current = returningToSelection ? "pending" : "none";
    setOfferWorkspaceActive(false);
    // The selection portal remounts after leaving the workspace. Its callback
    // ref restores focus on that commit, rather than focusing a detached button.
    if (returningToSelection) return;
    requestAnimationFrame(() => {
      if (offerReturnFocus.current?.isConnected)
        offerReturnFocus.current.focus();
      else
        document
          .querySelector<HTMLButtonElement>(
            '[data-collect-navigation] button[aria-pressed="true"]'
          )
          ?.focus({ preventScroll: true });
    });
  };
  const [batch, setBatch] = useState<{
    items: readonly CollectSelectedListing[];
    recipient?: string;
  } | null>(null);
  const [trade, setTrade] = useState<{
    asset: ApiCollectAsset;
    action: CollectTradeAction;
    order?: ApiMarketTradeOrder;
    quantity?: string;
    recipient?: string;
  } | null>(null);
  const { seizeConnect, address: payingWallet } = useSeizeConnectContext();
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
  const selectionFor = (id: string) =>
    collectArtworkSelection({
      entry: discovery.entries.find(
        (item) => collectCatalogEntryId(item) === id
      ),
      selection,
      profileWallets: collectProfileWallets(connectedProfile).map(
        (wallet) => wallet.wallet
      ),
      locale,
      orderIsPending,
      orderIsPendingNow,
      setSelection,
    });
  const plan =
    sourceCostPlan && profile
      ? collectCostPlanView(
          sourceCostPlan,
          profile,
          t(locale, `collect.intent.${intent}`),
          locale,
          planScenario
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
    setOfferWorkspaceActive(false);
    const requested = requestedNavigation.current;
    const next = new URLSearchParams(requested.query);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    requested.query = next.toString();
    requested.pending.add(requested.query);
    router.replace(`/collect?${requested.query}`, { scroll: false });
  };
  const changeCollection = (value: CollectCollection) => {
    const requested = collectLocation(requestedNavigation.current.query);
    if (value === requested.collection) return;
    updateQuery({
      collection: value,
      intent: collectIntentForCollection(requested.intent, value),
      definition: "",
      token: "",
      q: "",
    });
  };
  const changeIntent = (value: CollectIntent) => {
    const requested = collectLocation(requestedNavigation.current.query);
    updateQuery({
      collection: requested.collection,
      intent: collectIntentForCollection(value, requested.collection),
      definition: "",
      view: "",
      token: "",
      q: "",
    });
  };
  let goalContent: ReactNode;
  if (["season", "full_set", "artist", "pebbles_set"].includes(intent))
    goalContent = (
      <CollectGoalsController
        draft={goalDraft}
        purchases={purchases}
        revision={goalState.revision}
        catalog={catalog.data}
        catalogFailed={catalog.isError && !catalog.isFetching}
        onRetryCatalog={() => {
          void catalog.refetch();
        }}
        profile={connectedProfile}
        completion={{
          collection,
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
        revision={settlementRevision}
        collection={collection}
        profile={connectedProfile}
        payingWallet={payingWallet}
        snapshot={discovery.tdhSnapshot}
        projection={tdhProjection}
        onToggleProjection={() =>
          updateQuery({
            view:
              new URLSearchParams(requestedNavigation.current.query).get(
                "view"
              ) === "projection"
                ? ""
                : "projection",
          })
        }
        onConnect={connect}
        onReviewPurchase={(items, recipient) => setBatch({ items, recipient })}
        onPlanOffers={(targetPlan) =>
          openOffers(collectSelectedOfferSelection(targetPlan.items))
        }
        onDailyPlanOffers={(dailyPlan) =>
          openOffers(collectSelectedOfferSelection(dailyPlan.items))
        }
      />
    );
  const missingOffers = costPlan
    ? collectMissingOfferSelection(
        costPlan.analysis.requirements,
        costPlan.result.legs
      )
    : null;
  const chooseStrategy = (strategy: CollectAcquisitionStrategy) => {
    if (strategy === "buy") {
      if (offerWorkspaceActive) closeOffers();
      return;
    }
    if (missingOffers)
      openOffers(
        missingOffers.items,
        missingOffers.hasAlternatives,
        false,
        strategy
      );
  };
  const workspacePlanMatches = Boolean(
    planFingerprint && offerWorkspace?.planFingerprint === planFingerprint
  );
  const resumablePurchase = blendedPurchase !== null;
  const releasePurchase = () => {
    if (currentBlendedPurchase.current !== blendedPurchase) return;
    currentBlendedPurchase.current = null;
    setBlendedPurchaseOpen(false);
    setBlendedPurchase(null);
    setBlendedBuyLocks([]);
  };
  let initialOfferMethod: OfferPriceMethod = "manual";
  const strategy = offerWorkspace?.strategy;
  if (strategy === "blended") initialOfferMethod = "match_bid";
  else if (strategy && strategy !== "buy") initialOfferMethod = strategy;
  return (
    <CollectPlanMetadataProvider
      catalog={catalog.data}
      knownAssets={[
        ...discovery.entries.map((entry) => entry.asset),
        ...selection.map((item) => item.asset),
        ...(offerWorkspace?.items.flatMap((item) =>
          item.asset ? [item.asset] : []
        ) ?? []),
      ]}
      assetKeys={[
        ...(sourceCostPlan?.analysis.requirements.flatMap((requirement) =>
          requirement.asset_keys.length === 1 ? requirement.asset_keys : []
        ) ?? []),
        ...(costPlan?.result.legs.map((leg) => leg.asset_key) ?? []),
        ...(offerWorkspace?.items.flatMap((item) =>
          item.assetKey ? [item.assetKey] : []
        ) ?? []),
      ]}
    >
      <CollectPageView
        catalog={catalogView}
        collection={collection}
        intent={intent}
        profile={profile}
        plan={
          plan && blendedPurchase
            ? {
                ...plan,
                reviewDisabledReason: t(locale, "collect.blend.finishReview"),
              }
            : plan
        }
        goalContent={goalContent}
        workspaceActive={offerWorkspaceActive}
        recoveryContent={
          blendedPurchase &&
          !blendedPurchaseOpen && (
            <div className="tw-mb-5 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-y tw-border-solid tw-border-white/10 tw-py-3">
              <p className="tw-m-0 tw-text-sm tw-text-iron-300">
                {t(
                  locale,
                  blendedPurchase.fingerprint === planFingerprint
                    ? "collect.blend.retainedPurchase"
                    : "collect.blend.previousPurchase"
                )}
              </p>
              <button
                ref={focusResumePurchase}
                type="button"
                onClick={() => setBlendedPurchaseOpen(true)}
                className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-text-iron-100 hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {t(
                  locale,
                  blendedPurchase.fingerprint === planFingerprint
                    ? "collect.blend.resumePurchase"
                    : "collect.blend.resumePriorPurchase"
                )}
              </button>
            </div>
          )
        }
        workspaceContent={
          offerWorkspace && (
            <>
              {offerWorkspace.strategy && (
                <CollectStrategyPicker
                  value={offerWorkspace.strategy}
                  locale={locale}
                  onChange={chooseStrategy}
                />
              )}
              <CollectOfferWorkspace
                items={offerWorkspace.items}
                hasAlternatives={offerWorkspace.hasAlternatives}
                active={offerWorkspaceActive}
                onBack={closeOffers}
                initialMethod={initialOfferMethod}
                strategySessionKey={offerWorkspace.sessionKey}
                blended={offerWorkspace.strategy === "blended"}
                buyOptions={
                  workspacePlanMatches ? (costPlan?.result.legs ?? []) : []
                }
                buyObservedAt={
                  workspacePlanMatches
                    ? costPlan?.result.evaluated_at
                    : undefined
                }
                buyLockedAssetKeys={blendedBuyLocks}
                onReviewBuys={
                  resumablePurchase
                    ? undefined
                    : (legs) => {
                        if (
                          costPlan &&
                          workspacePlanMatches &&
                          currentPlanFingerprint.current === planFingerprint &&
                          currentBlendedPurchase.current === null
                        ) {
                          const reviewedLegs = collectPlanReviewLegs(
                            costPlan,
                            legs
                          );
                          if (reviewedLegs.length === 0) return;
                          setBlendedBuyLocks((keys) => [
                            ...new Set([
                              ...keys,
                              ...reviewedLegs.map((leg) => leg.asset_key),
                            ]),
                          ]);
                          const purchase = {
                            fingerprint: collectPlanReviewFingerprint(costPlan),
                            plan: costPlan,
                            legs: reviewedLegs,
                          };
                          currentBlendedPurchase.current = purchase;
                          setBlendedPurchase(purchase);
                          setBlendedPurchaseOpen(true);
                        }
                      }
                }
              />
            </>
          )
        }
        showListings={
          intent === "lowest" || (intent === "tdh" && !tdhProjection)
        }
        selectionFor={selectionFor}
        selectionSummary={
          availableSelection.length > 0 ? (
            <CollectSelectionBar
              active={!offerWorkspaceActive}
              items={availableSelection}
              onClear={clearSelection}
              onReview={() => setBatch({ items: availableSelection })}
              planOffersRef={setSelectionOfferTrigger}
              onPlanOffers={() =>
                openOffers(
                  collectSelectedOfferSelection(availableSelection),
                  false,
                  true
                )
              }
            />
          ) : null
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
          if (
            currentBlendedPurchase.current === null &&
            costPlan?.id === id &&
            costPlan.revision === revision
          )
            setBasketPlan(costPlan);
        }}
        onPlanScenarioChange={(scenario) => {
          if (sourceCostPlan) {
            setScenarioState({ planId: sourceCostPlan.id, scenario });
          }
        }}
        onPlanStrategyChange={
          (missingOffers?.items.length ?? 0) > 0 ? chooseStrategy : undefined
        }
        onPlanOffers={
          missingOffers !== null && missingOffers.items.length > 0
            ? () =>
                openOffers(missingOffers.items, missingOffers.hasAlternatives)
            : undefined
        }
      />
      {basketPlan && (
        <CollectPlanBasket
          plan={basketPlan}
          onClose={() => setBasketPlan(null)}
          onSettled={invalidateSettledPlans}
        />
      )}
      {blendedPurchase && (
        <CollectPlanBasket
          plan={blendedPurchase.plan}
          reviewLegs={blendedPurchase.legs}
          open={blendedPurchaseOpen}
          onClose={() => {
            if (blendedPurchase.settled) releasePurchase();
            else setBlendedPurchaseOpen(false);
          }}
          onDiscard={releasePurchase}
          onSettled={() => {
            if (currentBlendedPurchase.current !== blendedPurchase) return;
            if (blendedPurchaseOpen) {
              const completedPurchase = { ...blendedPurchase, settled: true };
              currentBlendedPurchase.current = completedPurchase;
              setBlendedPurchase(completedPurchase);
              setBlendedBuyLocks([]);
            } else releasePurchase();
            invalidateSettledPlans();
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
          onSettled={invalidateSettledPlans}
        />
      )}
      {batch && (
        <CollectBatchController
          items={batch.items}
          onItemsChange={(remaining) =>
            setSelection((current) =>
              current.filter(
                (item) =>
                  !batch.items.some((original) => original === item) ||
                  remaining.some((retained) => retained === item)
              )
            )
          }
          {...(batch.recipient ? { initialRecipient: batch.recipient } : {})}
          onClose={() => setBatch(null)}
          onSettled={invalidateSettledPlans}
        />
      )}
    </CollectPlanMetadataProvider>
  );
}
