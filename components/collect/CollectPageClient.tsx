"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
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
import CollectPageView, { COLLECT_INTENTS } from "./CollectPageView";
import CollectTradeController from "./CollectTradeController";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { collectLowestArtworkEntries } from "./collect-catalog.helpers";
import CollectSelectionBar from "./CollectSelectionBar";
import CollectBatchController from "./CollectBatchController";
import {
  collectSelectionItem,
  toggleCollectSelection,
  type CollectSelectedListing,
} from "./collect-selection.helpers";
import {
  collectListingKey,
  collectOrderPurchaseQuantity,
} from "./collect-buy.helpers";
import type { CollectArtworkSelection } from "./CollectArtworkCard";
import CollectOfferWorkspace from "./CollectOfferWorkspace";
import CollectStrategyPicker from "./CollectStrategyPicker";
import type {
  CollectOfferSelection,
  OfferPriceMethod,
} from "./collect-offer-plan.types";
import {
  collectMissingOfferSelection,
  collectSelectedOfferSelection,
} from "./collect-offer-selection.helpers";

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
  const [basketOpen, setBasketOpen] = useState(false);
  const [blendedPurchase, setBlendedPurchase] = useState<{
    fingerprint: string;
    plan: ApiCollectPlan;
    legs: readonly ApiCollectPlanLeg[];
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
  const [selection, setSelection] = useState<CollectSelectedListing[]>([]);
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
  const { connectedProfile, requestAuth } = useAuth();
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
  const selectionFor = (id: string): CollectArtworkSelection | undefined => {
    const entry = discovery.entries.find(
      (item) => collectCatalogEntryId(item) === id
    );
    if (!entry?.order) return undefined;
    const order = entry.order,
      key = collectListingKey(order);
    const selected = selection.some(
      (item) => collectListingKey(item.order) === key
    );
    const duplicate721 =
      entry.asset.family !== ApiCollectFamily.Memes &&
      selection.some((item) => item.asset.asset_key === entry.asset.asset_key);
    let disabledReason: string | undefined;
    if (!selected) {
      if (duplicate721)
        disabledReason = t(locale, "collect.selection.alreadySelected");
      else if (selection.length >= 128)
        disabledReason = t(locale, "collect.selection.limit", { count: 128 });
      else if (collectOrderPurchaseQuantity(order) === null)
        disabledReason = t(locale, "collect.trade.unavailable");
    }
    return {
      selected,
      disabledReason,
      onToggle: () => {
        if (selected) {
          setSelection((items) =>
            items.filter((item) => collectListingKey(item.order) !== key)
          );
          return;
        }
        if (disabledReason) return;
        const candidate = collectSelectionItem({
          asset: entry.asset,
          order,
          profileWallets: collectProfileWallets(connectedProfile).map(
            (wallet) => wallet.wallet
          ),
          nowSeconds: Math.floor(Date.now() / 1000),
        });
        if (candidate)
          setSelection((items) => toggleCollectSelection(items, candidate));
      },
    };
  };
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
        catalogFailed={catalog.isError && !catalog.isFetching}
        onRetryCatalog={() => {
          void catalog.refetch();
        }}
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
        profile={connectedProfile}
        payingWallet={payingWallet}
        snapshot={discovery.tdhSnapshot}
        projection={tdhProjection}
        onToggleProjection={() =>
          updateQuery({ view: tdhProjection ? "" : "projection" })
        }
        onConnect={connect}
        onReviewPurchase={(items, recipient) => setBatch({ items, recipient })}
        onPlanOffers={(targetPlan) =>
          openOffers(collectSelectedOfferSelection(targetPlan.items))
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
      closeOffers();
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
  if (strategy === "blended") initialOfferMethod = "goal";
  else if (strategy && strategy !== "buy") initialOfferMethod = strategy;
  return (
    <>
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
        showCollections={!tdhProjection}
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
          selection.length > 0 ? (
            <CollectSelectionBar
              active={!offerWorkspaceActive}
              items={selection}
              onClear={() => setSelection([])}
              onReview={() => setBatch({ items: selection })}
              planOffersRef={setSelectionOfferTrigger}
              onPlanOffers={() =>
                openOffers(
                  collectSelectedOfferSelection(selection),
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
            setBasketOpen(true);
        }}
        onPlanScenarioChange={(scenario) => {
          if (sourceCostPlan) {
            setScenarioState({ planId: sourceCostPlan.id, scenario });
            setBasketOpen(false);
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
      {basketOpen && costPlan && (
        <CollectPlanBasket
          plan={costPlan}
          onClose={() => setBasketOpen(false)}
          onSettled={() => setCostPlan(null)}
        />
      )}
      {blendedPurchase && (
        <CollectPlanBasket
          plan={blendedPurchase.plan}
          reviewLegs={blendedPurchase.legs}
          open={blendedPurchaseOpen}
          onClose={() => setBlendedPurchaseOpen(false)}
          onDiscard={releasePurchase}
          onSettled={() => {
            if (currentBlendedPurchase.current !== blendedPurchase) return;
            releasePurchase();
            setCostPlan(null);
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
      {batch && (
        <CollectBatchController
          items={batch.items}
          {...(batch.recipient ? { initialRecipient: batch.recipient } : {})}
          onClose={() => setBatch(null)}
          onSettled={(completed) => {
            setSelection((items) =>
              items.filter(
                (item) =>
                  !completed.items.some(
                    (purchased) =>
                      purchased.asset_key === item.asset.asset_key &&
                      purchased.order.order_hash.toLowerCase() ===
                        item.order.identity.order_hash.toLowerCase()
                  )
              )
            );
            setCostPlan(null);
          }}
        />
      )}
    </>
  );
}
