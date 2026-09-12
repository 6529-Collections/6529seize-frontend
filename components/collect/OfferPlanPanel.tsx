"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatInteger, formatTime } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useEffect, useId, useRef, useState } from "react";
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
} from "./collect-offer-plan.types";
import OfferPlanItem from "./OfferPlanItem";
import OfferPlanPricing, { OFFER_INPUT_CLASS } from "./OfferPlanPricing";

export interface OfferPlanPanelProps {
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
      key={offerPlanScope(props.items, props.profile, props.payingWallet)}
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
}: OfferPlanPanelProps) {
  const locale = useBrowserLocale();
  const id = useId();
  const [rows, setRows] = useState(() => initialOfferRows(items));
  const [controls, setControls] = useState<OfferPricingControls>({
    method: "manual",
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
  const publishedAssetKeys = [
    ...new Set([
      ...legacyPublished,
      ...publishedOffers.map((offer) => offer.assetKey),
      ...pendingOffers.map((offer) => offer.assetKey),
    ]),
  ];
  const publishedScope = JSON.stringify({
    keys: [...publishedAssetKeys].sort((a, b) => a.localeCompare(b)),
    offers: publishedOffers,
    pending: pendingOffers,
  });
  const analysis =
    analysisResult?.scope === publishedScope ? analysisResult.view : null;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    generation.current++;
  }, [publishedScope]);

  const totals = offerPlanTotals(rows, publishedAssetKeys);
  const selected = rows.filter(
    (row) => row.selected && !publishedAssetKeys.includes(row.assetKey)
  );
  const budget =
    controls.method === "goal" ? offerUnitWei(controls.budgetEth) : null;
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
  const reason =
    disabledReason ??
    (!profile?.id ||
    !payingWallet ||
    !isCollectProfileWallet(profile, payingWallet)
      ? t(locale, "collect.trade.connectSigner")
      : undefined);
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
  const money = (amount: bigint | string) =>
    t(locale, "collect.offerPlan.weth", {
      amount: formatDecimalString(locale, formatEther(BigInt(amount))),
    });

  const changed = () => {
    generation.current++;
    setError(undefined);
    setAnalysis(null);
  };
  const changeRow = (next: OfferPlanRow) => {
    changed();
    setRows((current) =>
      current.map((row) => (row.assetKey === next.assetKey ? next : row))
    );
  };
  const changeControls = (next: OfferPricingControls) => {
    changed();
    if (next.expiryHours !== controls.expiryHours)
      setRows((current) =>
        current.map((row) =>
          !publishedAssetKeys.includes(row.assetKey) &&
          row.expiryHours === controls.expiryHours
            ? { ...row, expiryHours: next.expiryHours }
            : row
        )
      );
    if (next.method !== controls.method && next.method !== "manual")
      setRows((current) =>
        current.map((row) =>
          row.pinned || publishedAssetKeys.includes(row.assetKey)
            ? row
            : { ...row, unitPriceEth: "" }
        )
      );
    setControls(next);
  };
  const analyzePrices = async () => {
    if (pending.current || reason || !profile?.id || !payingWallet) return;
    const invalid = offerAnalysisIssue(selected, controls, unknownPublished);
    if (invalid) {
      setError(t(locale, invalid));
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(undefined);
    const revision = ++generation.current;
    try {
      const result = await analyze({
        profileId: profile.id,
        wallet: payingWallet,
        rows: selected,
        controls,
        committedAmountWei: (committed ?? 0n).toString(),
      });
      if (!mounted.current || revision !== generation.current) return;
      setRows((current) => {
        const next = new Map(
          applyOfferPrices(
            current.filter((row) => !publishedAssetKeys.includes(row.assetKey)),
            result.prices,
            controls.method
          ).map((row) => [row.assetKey, row])
        );
        return current.map((row) => next.get(row.assetKey) ?? row);
      });
      setAnalysis({ scope: publishedScope, view: result });
    } catch {
      if (mounted.current && revision === generation.current)
        setError(t(locale, "collect.offerPlan.analysisFailed"));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  let calculateLabel = t(locale, "collect.offerPlan.calculate");
  if (controls.method === "manual")
    calculateLabel = t(locale, "collect.offerPlan.checkAmounts");
  if (busy) calculateLabel = t(locale, "collect.offerPlan.calculating");

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
          {t(locale, "collect.offerPlan.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-relaxed tw-text-iron-400">
          {t(locale, "collect.offerPlan.intro")}
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
          disabled={busy}
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
        <label className="tw-min-w-0 tw-flex-1 tw-space-y-1 tw-text-xs tw-text-iron-300">
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
                publishedAssetKeys.includes(row.assetKey)
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
                publishedAssetKeys.includes(row.assetKey)
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
          selected: formatInteger(locale, selected.length),
          total: formatInteger(locale, rows.length),
        })}
      </p>
      <ol
        className="tw-m-0 tw-list-none tw-p-0"
        aria-label={t(locale, "collect.offerPlan.nfts")}
      >
        {visible.map((row) => (
          <OfferPlanItem
            key={row.assetKey}
            row={row}
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
              (controls.method === "goal" && budget === null)
            }
            onChange={changeRow}
            onReview={() => {
              if (
                busy ||
                reason ||
                exceedsBudget ||
                fundingConflict ||
                (controls.method === "goal" && budget === null) ||
                !row.asset ||
                !row.selected ||
                offerRowIssue(row) !== null ||
                publishedAssetKeys.includes(row.assetKey)
              )
                return;
              onReviewOffer({
                asset: row.asset,
                quantity: row.quantity,
                unitPriceEth: row.unitPriceEth,
                expiryHours: row.expiryHours,
                ...(controls.method === "goal"
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
