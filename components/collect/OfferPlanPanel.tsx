"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatInteger, formatTime } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { formatEther } from "viem";
import { isCollectProfileWallet } from "./collect-recipient.helpers";
import {
  applyOfferPrices,
  initialOfferRows,
  offerAnalysisIssue,
  offerPlanScope,
  offerPlanTotals,
  offerPublishedTotal,
  offerRowIssue,
  offerUnitWei,
} from "./collect-offer-plan.helpers";
import type {
  CollectOfferSelection,
  OfferPlanAnalysisInput,
  OfferPlanAnalysisView,
  OfferPlanReview,
  OfferPlanRow,
  OfferPricingControls,
  PublishedOfferCommitment,
  PendingOfferCommitment,
  OfferPlanAcquisitionProps,
} from "./collect-offer-plan.types";
import { offerBuyOptions } from "./collect-offer-blend.helpers";
import { collectPlanSelectionCost } from "./collect-plan-selection.helpers";
import { MARKET_BATCH_LIMITS } from "./market-batch-validation";
import OfferPlanItem from "./OfferPlanItem";
import OfferPlanBuySummary from "./OfferPlanBuySummary";
import OfferPlanPricing, { OFFER_INPUT_CLASS } from "./OfferPlanPricing";
import { useCollectPlanMetadata } from "./CollectPlanMetadataProvider";
import { matchingCollectAsset } from "./collect-plan-metadata";
import { analyzeBlendedOffers } from "./collect-blended-analysis";
import type { BlendRoute } from "./collect-blended-policy";

interface OfferPlanPanelProps extends OfferPlanAcquisitionProps {
  readonly items: readonly CollectOfferSelection[];
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string | undefined;
  readonly disabledReason?: string | undefined;
  readonly publishedAssetKeys?: readonly string[] | undefined;
  readonly publishedOffers?: readonly PublishedOfferCommitment[] | undefined;
  readonly pendingOffers?: readonly PendingOfferCommitment[] | undefined;
  readonly onReviewPending?:
    | ((offer: PendingOfferCommitment) => void)
    | undefined;
  readonly analyze: (
    input: OfferPlanAnalysisInput
  ) => Promise<OfferPlanAnalysisView>;
  readonly onReviewOffer: (offer: OfferPlanReview) => void;
}

const PAGE_SIZE = 24;
const TEXT_BUTTON =
  "tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-text-sm tw-text-iron-100 enabled:hover:tw-bg-white/5 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-40";

/** One scope owns private edits; a wallet, profile, membership or selected-quantity change discards them. */
export default function OfferPlanPanel(props: OfferPlanPanelProps) {
  return (
    <OfferPlanContents
      key={JSON.stringify([
        offerPlanScope(props.items, props.profile, props.payingWallet),
        props.strategySessionKey ?? "",
      ])}
      {...props}
    />
  );
}

function OfferPlanContents({
  items,
  profile,
  payingWallet,
  disabledReason,
  publishedAssetKeys: legacyPublished = [],
  publishedOffers = [],
  pendingOffers = [],
  onReviewPending,
  analyze,
  onReviewOffer,
  initialMethod = "manual",
  blended = false,
  buyOptions = [],
  buyObservedAt,
  buyLockedAssetKeys = [],
  onReviewBuys,
}: OfferPlanPanelProps) {
  const locale = useBrowserLocale();
  const id = useId();
  const metadata = useCollectPlanMetadata();
  const [storedRows, setRows] = useState(() => initialOfferRows(items));
  const rows = storedRows.map((row) => ({
    ...row,
    asset:
      matchingCollectAsset(row.assetKey, row.asset) ??
      metadata.assets.get(row.assetKey),
  }));
  const [buyKeys, setBuyKeys] = useState<readonly string[]>([]);
  const [routeOverrides, setRouteOverrides] = useState<
    ReadonlyMap<string, BlendRoute>
  >(new Map());
  const [controls, setControls] = useState<OfferPricingControls>({
    method: blended ? "match_bid" : initialMethod,
    blendTier: "base",
    percent: "5",
    budgetEth: "",
    expiryHours: "168",
  });
  const [analysisResult, setAnalysis] = useState<{
    scope: string;
    view: OfferPlanAnalysisView;
  } | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const generation = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(false);
  const automaticAttempt = useRef<string | null>(null);
  const publishedAssetKeys = [
    ...new Set([
      ...legacyPublished,
      ...publishedOffers.map((offer) => offer.assetKey),
      ...pendingOffers.map((offer) => offer.assetKey),
    ]),
  ];
  const reason =
    disabledReason ??
    (!profile?.id ||
    !payingWallet ||
    !isCollectProfileWallet(profile, payingWallet)
      ? t(locale, "collect.trade.connectSigner")
      : undefined);
  const publishedScope = JSON.stringify({
    keys: [...publishedAssetKeys].sort((a, b) => a.localeCompare(b)),
    offers: publishedOffers,
    pending: pendingOffers,
    buys: buyKeys,
    buyLocks: buyLockedAssetKeys,
    reason,
    ...(blended ? { buyOptions, buyObservedAt } : {}),
  });
  const analysis =
    analysisResult?.scope === publishedScope ? analysisResult.view : null;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // Invalidate during commit, before an old request can complete ahead of passive effects/debounce.
  useLayoutEffect(() => {
    generation.current++;
  }, [publishedScope]);

  const excludedOfferKeys = [
    ...publishedAssetKeys,
    ...buyKeys,
    ...buyLockedAssetKeys,
  ];
  const availableBuys = offerBuyOptions(rows, blended ? buyOptions : []);
  const selectedBuyRows = rows.filter(
    (row) =>
      row.selected &&
      buyKeys.includes(row.assetKey) &&
      !publishedAssetKeys.includes(row.assetKey) &&
      !buyLockedAssetKeys.includes(row.assetKey)
  );
  const selectedBuyLegs = selectedBuyRows.flatMap(
    (row) => availableBuys.get(row.assetKey)?.legs ?? []
  );
  const buyCostWei = collectPlanSelectionCost(selectedBuyLegs);
  const totals = offerPlanTotals(rows, excludedOfferKeys);
  const selected = rows.filter(
    (row) => row.selected && !excludedOfferKeys.includes(row.assetKey)
  );
  const analysisRows = blended
    ? rows.filter(
        (row) =>
          row.selected &&
          !publishedAssetKeys.includes(row.assetKey) &&
          !buyLockedAssetKeys.includes(row.assetKey)
      )
    : selected;
  const budget = offerUnitWei(controls.budgetEth);
  const commitments = [...publishedOffers, ...pendingOffers];
  const committed = offerPublishedTotal(commitments);
  const publishedAmount = offerPublishedTotal(publishedOffers);
  const pendingAmount = offerPublishedTotal(pendingOffers);
  const unknownPublished =
    committed === null ||
    publishedAssetKeys.some(
      (key) => !commitments.some((offer) => offer.assetKey === key)
    );
  const exceedsBudget =
    budget !== null && (unknownPublished || totals.amount + committed > budget);
  const fundingConflict =
    analysis !== null && totals.amount > BigInt(analysis.availableWei);
  const filtered = rows.filter((row) =>
    `${row.asset?.name ?? ""} ${row.assetKey}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  const lastPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const visiblePage = Math.min(page, lastPage);
  const visible = filtered.slice(
    visiblePage * PAGE_SIZE,
    (visiblePage + 1) * PAGE_SIZE
  );
  const prices = new Map(
    analysis?.prices.map((price) => [price.assetKey, price])
  );
  const buyNeedsRefresh =
    blended &&
    (analysis === null ||
      selectedBuyRows.some(
        (row) =>
          !availableBuys.has(row.assetKey) ||
          prices
            .get(row.assetKey)
            ?.reasons.some(
              (code) =>
                code === "BLEND_buy_unavailable" ||
                code === "BLEND_stale_reference" ||
                code === "BLEND_invalid_quantity"
            )
      ));
  const money = (amount: bigint | string) =>
    t(locale, "collect.offerPlan.weth", {
      amount: formatDecimalString(locale, formatEther(BigInt(amount))),
    });
  const automaticKey = JSON.stringify([
    controls.method,
    controls.blendTier,
    controls.percent,
    controls.budgetEth,
    controls.expiryHours,
    controls.expiryDateTime,
    analysisRows.map((row) => [
      row.assetKey,
      row.quantity,
      row.pinned,
      row.pinned ? row.unitPriceEth : "",
      row.expiryHours,
      row.expiryDateTime,
    ]),
    blended
      ? [
          publishedAssetKeys,
          publishedOffers,
          pendingOffers,
          buyLockedAssetKeys,
          [...routeOverrides],
          buyObservedAt,
          buyOptions,
        ]
      : publishedScope,
    reason,
  ]);

  const changed = () => {
    generation.current++;
    setError(undefined);
    setAnalysis(null);
  };
  const changeRow = (next: OfferPlanRow) => {
    if (
      publishedAssetKeys.includes(next.assetKey) ||
      buyLockedAssetKeys.includes(next.assetKey)
    )
      return;
    changed();
    setRows((current) =>
      current.map((row) => (row.assetKey === next.assetKey ? next : row))
    );
  };
  const changeRoute = (assetKey: string, buying: boolean) => {
    if (
      busy ||
      buyKeys.includes(assetKey) === buying ||
      publishedAssetKeys.includes(assetKey) ||
      buyLockedAssetKeys.includes(assetKey) ||
      (buying && !availableBuys.has(assetKey))
    )
      return;
    changed();
    setRouteOverrides((current) =>
      new Map(current).set(assetKey, buying ? "buy" : "offer")
    );
    setBuyKeys((current) =>
      buying
        ? [...new Set([...current, assetKey])]
        : current.filter((key) => key !== assetKey)
    );
    setRows((current) =>
      current.map((row) =>
        row.pinned ||
        publishedAssetKeys.includes(row.assetKey) ||
        buyLockedAssetKeys.includes(row.assetKey)
          ? row
          : { ...row, unitPriceEth: "" }
      )
    );
  };
  const changeControls = (next: OfferPricingControls) => {
    changed();
    if (
      next.expiryHours !== controls.expiryHours ||
      next.expiryDateTime !== controls.expiryDateTime
    )
      setRows((current) =>
        current.map((row) =>
          !publishedAssetKeys.includes(row.assetKey) &&
          !buyLockedAssetKeys.includes(row.assetKey) &&
          row.expiryHours === controls.expiryHours &&
          row.expiryDateTime === controls.expiryDateTime
            ? updatedDefaultExpiry(row, next)
            : row
        )
      );
    const changedFormula =
      (next.method === "improve_bid" || next.method === "discount_ask") &&
      next.percent !== controls.percent;
    const changedGoalBudget = next.budgetEth !== controls.budgetEth;
    if (
      (next.method !== controls.method && next.method !== "manual") ||
      changedFormula ||
      changedGoalBudget ||
      next.blendTier !== controls.blendTier
    )
      setRows((current) =>
        current.map((row) =>
          row.pinned ||
          publishedAssetKeys.includes(row.assetKey) ||
          buyLockedAssetKeys.includes(row.assetKey)
            ? row
            : { ...row, unitPriceEth: "" }
        )
      );
    setControls(next);
  };
  const analyzePrices = async () => {
    if (pending.current || reason || !profile?.id || !payingWallet) return;
    automaticAttempt.current = automaticKey;
    const invalid = offerAnalysisIssue(
      analysisRows,
      controls,
      unknownPublished
    );
    if (invalid) {
      setError(t(locale, invalid));
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(undefined);
    setAnalysis(null);
    const revision = ++generation.current;
    try {
      const input: OfferPlanAnalysisInput = {
        profileId: profile.id,
        wallet: payingWallet,
        rows: analysisRows,
        controls,
        committedAmountWei: (committed ?? 0n).toString(),
      };
      const isCurrent = () =>
        mounted.current && revision === generation.current;
      const blendedResult = blended
        ? await analyzeBlendedOffers({
            input,
            analyze,
            isCurrent,
            policy: {
              tier: controls.blendTier ?? "base",
              buyOptions: availableBuys,
              buyObservedAt,
              lockedAssetKeys: new Set([
                ...publishedAssetKeys,
                ...buyLockedAssetKeys,
              ]),
              routeOverrides,
            },
          })
        : null;
      if (blended && !blendedResult) return;
      const result = blendedResult ? blendedResult.view : await analyze(input);
      if (!mounted.current || revision !== generation.current) return;
      const nextBuyKeys = blendedResult
        ? [...blendedResult.proposal.buyKeys]
        : buyKeys;
      const applyExcluded = blended
        ? [...publishedAssetKeys, ...buyLockedAssetKeys]
        : excludedOfferKeys;
      setRows((current) => {
        const next = new Map(
          applyOfferPrices(
            current.filter((row) => !applyExcluded.includes(row.assetKey)),
            result.prices,
            controls.method
          ).map((row) => [row.assetKey, row])
        );
        return current.map((row) => next.get(row.assetKey) ?? row);
      });
      if (blendedResult) setBuyKeys(nextBuyKeys);
      setAnalysis({
        scope: JSON.stringify({
          keys: [...publishedAssetKeys].sort((a, b) => a.localeCompare(b)),
          offers: publishedOffers,
          pending: pendingOffers,
          buys: nextBuyKeys,
          buyLocks: buyLockedAssetKeys,
          reason,
          ...(blended ? { buyOptions, buyObservedAt } : {}),
        }),
        view: result,
      });
    } catch {
      if (mounted.current && revision === generation.current)
        setError(t(locale, "collect.offerPlan.analysisFailed"));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const latestAnalysis = useRef(analyzePrices);
  useEffect(() => {
    latestAnalysis.current = analyzePrices;
  });
  useEffect(() => {
    if (
      controls.method === "manual" ||
      busy ||
      reason ||
      automaticAttempt.current === automaticKey
    )
      return;
    const timer = globalThis.setTimeout(() => {
      void latestAnalysis.current();
    }, 350);
    return () => globalThis.clearTimeout(timer);
  }, [automaticKey, controls.method, busy, reason]);
  useEffect(() => {
    if (!blended || analysis === null) return;
    const timer = globalThis.setTimeout(
      () => {
        if (pending.current) return;
        generation.current++;
        setAnalysis(null);
        setError(t(locale, "collect.blend.refreshRequired"));
      },
      Math.max(0, Date.parse(analysis.validUntil) - Date.now())
    );
    return () => globalThis.clearTimeout(timer);
  }, [analysis, blended, locale]);

  let calculateLabel = t(locale, "collect.offerPlan.refreshPrices");
  if (controls.method === "manual")
    calculateLabel = t(locale, "collect.offerPlan.checkAmounts");
  if (busy) calculateLabel = t(locale, "collect.offerPlan.calculating");
  let introKey: MessageKey = "collect.offerPlan.intro";
  if (blended) introKey = "collect.blend.intro";
  else if (controls.method !== "manual")
    introKey = "collect.offerPlan.introCalculated";

  const handleReviewBuys = (reviewedAt: number) => {
    if (
      busy ||
      reason ||
      buyNeedsRefresh ||
      (analysis !== null && Date.parse(analysis.validUntil) <= reviewedAt) ||
      !onReviewBuys ||
      selectedBuyLegs.length === 0 ||
      selectedBuyLegs.length > MARKET_BATCH_LIMITS.orders ||
      buyCostWei === null
    )
      return;
    onReviewBuys(selectedBuyLegs);
  };

  if (!rows.length)
    return (
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "collect.offerPlan.empty")}
      </p>
    );
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="tw-min-w-0 tw-space-y-5"
    >
      <div>
        <h2
          id={`${id}-title`}
          className="tw-m-0 tw-text-lg tw-font-medium tw-text-iron-100"
        >
          {t(
            locale,
            blended ? "collect.blend.title" : "collect.offerPlan.title"
          )}
        </h2>
        <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-relaxed tw-text-iron-400">
          {t(locale, introKey)}
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void analyzePrices();
        }}
        className="tw-space-y-3"
      >
        <OfferPlanPricing
          value={controls}
          blended={blended}
          disabled={Boolean(reason)}
          error={error}
          onChange={changeControls}
        />
        <button
          type="submit"
          disabled={busy || Boolean(reason)}
          className={TEXT_BUTTON}
        >
          {calculateLabel}
        </button>
      </form>
      {reason && (
        <p role="status" className="tw-text-sm tw-text-iron-400">
          {reason}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
        <label className="tw-min-w-0 tw-basis-full tw-space-y-1 tw-text-xs tw-text-iron-300 sm:tw-flex-1">
          <span>{t(locale, "collect.offerPlan.findNFT")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            className={OFFER_INPUT_CLASS}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          className={TEXT_BUTTON}
          onClick={() => {
            changed();
            setRows((current) =>
              current.map((row) =>
                publishedAssetKeys.includes(row.assetKey) ||
                buyLockedAssetKeys.includes(row.assetKey)
                  ? row
                  : { ...row, selected: true }
              )
            );
          }}
        >
          {t(locale, "collect.offerPlan.selectAll")}
        </button>
        <button
          type="button"
          disabled={busy}
          className={TEXT_BUTTON}
          onClick={() => {
            changed();
            setRows((current) =>
              current.map((row) =>
                publishedAssetKeys.includes(row.assetKey) ||
                buyLockedAssetKeys.includes(row.assetKey)
                  ? row
                  : { ...row, selected: false }
              )
            );
          }}
        >
          {t(locale, "collect.offerPlan.clearSelection")}
        </button>
      </div>
      <p className="tw-m-0 tw-text-xs tw-text-iron-400">
        {t(locale, "collect.offerPlan.selectionCount", {
          selected: formatInteger(
            locale,
            rows.filter(
              (row) =>
                row.selected &&
                !publishedAssetKeys.includes(row.assetKey) &&
                !buyLockedAssetKeys.includes(row.assetKey)
            ).length
          ),
          total: formatInteger(locale, rows.length),
        })}
      </p>
      <ol
        className="tw-m-0 tw-list-none tw-p-0"
        aria-label={t(
          locale,
          blended ? "collect.blend.nfts" : "collect.offerPlan.nfts"
        )}
      >
        {visible.map((row) => (
          <OfferPlanItem
            key={row.assetKey}
            row={row}
            blended={blended}
            buying={
              buyKeys.includes(row.assetKey) ||
              buyLockedAssetKeys.includes(row.assetKey)
            }
            buyAvailable={availableBuys.has(row.assetKey)}
            buyCostWei={availableBuys.get(row.assetKey)?.costWei}
            buyReserved={buyLockedAssetKeys.includes(row.assetKey)}
            onRouteChange={(buying) => changeRoute(row.assetKey, buying)}
            price={prices.get(row.assetKey)}
            busy={busy}
            published={
              legacyPublished.includes(row.assetKey) ||
              publishedOffers.some((offer) => offer.assetKey === row.assetKey)
            }
            pending={pendingOffers.some(
              (offer) => offer.assetKey === row.assetKey
            )}
            reviewDisabled={
              Boolean(reason) ||
              exceedsBudget ||
              fundingConflict ||
              (blended && analysis === null) ||
              (blended && prices.get(row.assetKey)?.status !== "PRICED") ||
              (controls.method === "goal" && budget === null)
            }
            onChange={changeRow}
            onReview={() => {
              if (
                busy ||
                reason ||
                exceedsBudget ||
                fundingConflict ||
                (blended &&
                  (analysis === null ||
                    Date.parse(analysis.validUntil) <= Date.now())) ||
                (blended && prices.get(row.assetKey)?.status !== "PRICED") ||
                (controls.method === "goal" && budget === null) ||
                !row.asset ||
                !row.selected ||
                offerRowIssue(row) !== null ||
                excludedOfferKeys.includes(row.assetKey)
              )
                return;
              onReviewOffer({
                asset: row.asset,
                quantity: row.quantity,
                unitPriceEth: row.unitPriceEth,
                expiryHours: row.expiryHours,
                ...(row.expiryDateTime
                  ? { expiryDateTime: row.expiryDateTime }
                  : {}),
                ...(controls.method === "goal" || budget !== null
                  ? {
                      maximumOfferAmountWei: (
                        offerUnitWei(row.unitPriceEth)! * BigInt(row.quantity)
                      ).toString(),
                    }
                  : {}),
              });
            }}
          />
        ))}
      </ol>
      {!visible.length && (
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "collect.offerPlan.noMatches")}
        </p>
      )}
      {lastPage > 0 && (
        <nav
          aria-label={t(locale, "collect.offerPlan.pages")}
          className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3"
        >
          <button
            type="button"
            className={TEXT_BUTTON}
            disabled={visiblePage === 0}
            onClick={() => setPage(visiblePage - 1)}
          >
            {t(locale, "collect.offerPlan.previous")}
          </button>
          <span className="tw-text-xs tw-text-iron-400">
            {t(locale, "collect.offerPlan.pageCount", {
              current: formatInteger(locale, visiblePage + 1),
              total: formatInteger(locale, lastPage + 1),
            })}
          </span>
          <button
            type="button"
            className={TEXT_BUTTON}
            disabled={visiblePage === lastPage}
            onClick={() => setPage(visiblePage + 1)}
          >
            {t(locale, "collect.offerPlan.next")}
          </button>
        </nav>
      )}
      <div
        className="tw-sticky tw-bottom-0 tw-z-10 tw-space-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {blended && (
          <OfferPlanBuySummary
            costWei={buyCostWei}
            listings={selectedBuyLegs.length}
            disabled={
              busy || Boolean(reason) || !onReviewBuys || buyNeedsRefresh
            }
            onReview={handleReviewBuys}
          />
        )}
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
          <span className="tw-text-sm tw-text-iron-300">
            {t(locale, "collect.offerPlan.proposed", {
              count: formatInteger(locale, totals.priced),
            })}
          </span>
          <strong className="tw-break-all tw-text-base tw-font-medium tw-tabular-nums tw-text-iron-100">
            {money(totals.amount)}
          </strong>
        </div>
        {totals.unresolved > 0 && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.offerPlan.unpriced", {
              count: formatInteger(locale, totals.unresolved),
            })}
          </p>
        )}
        {publishedAmount !== null && publishedAmount > 0n && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.offerPlan.committed", {
              amount: money(publishedAmount),
            })}
          </p>
        )}
        {pendingAmount !== null && pendingAmount > 0n && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.offerPlan.pendingCommitment", {
              amount: money(pendingAmount),
            })}
          </p>
        )}
        {pendingOffers
          .filter((offer) =>
            visible.some((row) => row.assetKey === offer.assetKey)
          )
          .map((offer) => (
            <button
              key={offer.operationId}
              type="button"
              className={TEXT_BUTTON}
              disabled={busy || !onReviewPending}
              onClick={() => onReviewPending?.(offer)}
            >
              {t(locale, "collect.offerPlan.checkPending", {
                token: offer.assetKey.split(":")[2] ?? "—",
              })}
            </button>
          ))}
        {exceedsBudget && (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
            {t(locale, "collect.offerPlan.overBudget")}
          </p>
        )}
        {fundingConflict && (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
            {t(locale, "collect.offerPlan.overFunding")}
          </p>
        )}
        {analysis && (
          <p className="tw-m-0 tw-text-xs tw-leading-relaxed tw-text-iron-400">
            {t(locale, "collect.offerPlan.fundingSnapshot", {
              commitments: money(analysis.trackedLiabilityWei),
              available: money(analysis.availableWei),
              time: formatTime(locale, analysis.createdAt),
            })}
          </p>
        )}
      </div>
      <details className="tw-text-xs tw-leading-relaxed tw-text-iron-400">
        <summary className="tw-min-h-6 tw-cursor-pointer tw-rounded-md tw-py-1 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "collect.offerPlan.howItWorks")}
        </summary>
        <p>{t(locale, "collect.offerPlan.independent")}</p>
        <p>{t(locale, "collect.offerPlan.observed")}</p>
        <p>{t(locale, "collect.offerPlan.liability")}</p>
        {analysis && (
          <>
            <p>{analysis.policyDescription}</p>
            <p>
              {t(locale, "collect.offerPlan.policy", {
                policy: analysis.policy,
              })}
            </p>
          </>
        )}
      </details>
    </section>
  );
}

function updatedDefaultExpiry(
  row: OfferPlanRow,
  controls: OfferPricingControls
): OfferPlanRow {
  const updated = { ...row, expiryHours: controls.expiryHours };
  delete updated.expiryDateTime;
  if (controls.expiryDateTime) updated.expiryDateTime = controls.expiryDateTime;
  return updated;
}
