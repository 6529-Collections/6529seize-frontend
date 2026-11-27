"use client";

import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import type { Abi, Hex } from "viem";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";
import { editionAuctionAbi } from "@/lib/stream/generated/UniformEditionAuction";
import { getStreamClient } from "@/lib/stream/client";
import {
  bidStanding,
  clearingCandidates,
  nearestStep,
  unitsByStepFrom,
  type BidStanding,
} from "@/lib/stream/editions";
import { encodeEditionOpenData } from "@/lib/stream/item";
import { quoteEditionBid, readStartItem, type EditionBidRow, type EditionDetail } from "@/lib/stream/reads";
import { editionView, sameAddress, type EditionView } from "@/lib/stream/state";

import { formatClock, formatCount, formatDuration, formatEth, shortAddress } from "./format";
import { CARD, LABEL } from "./OneOfOnePanel";
import { TxAction } from "./TxAction";
import { useNow } from "./useStreamData";
import { useStreamWallet, WalletGate } from "./WalletGate";

const abi = editionAuctionAbi as Abi;
const STEPPER =
  "tw-flex tw-h-12 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/25";
const STEPPER_BUTTON =
  "tw-w-12 tw-flex-none tw-border-0 tw-bg-transparent tw-text-xl tw-text-iron-300 hover:tw-bg-white/[0.06] hover:tw-text-white disabled:tw-opacity-40";
const STEPPER_INPUT =
  "tw-min-w-0 tw-flex-1 tw-border-0 tw-border-x tw-border-solid tw-border-white/[0.07] tw-bg-transparent tw-text-center tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400";

function standingLabel(standing: BidStanding, locale: SupportedLocale): string {
  if (standing === "in") return t(locale, "streamSepolia.ed.in");
  if (standing === "part") return t(locale, "streamSepolia.ed.part");
  return t(locale, "streamSepolia.ed.out");
}

const STANDING_TONE: Record<BidStanding, string> = {
  in: "tw-text-emerald-400",
  part: "tw-text-amber-300",
  out: "tw-text-iron-500",
};

function Result({
  detail,
  view,
  live,
}: {
  readonly detail: EditionDetail;
  readonly view: EditionView;
  readonly live: boolean;
}) {
  const locale = useBrowserLocale();
  const clearing = detail.clearing;
  const count = clearing ? Number(clearing.count) : 0;
  return (
    <section aria-labelledby="stream-ed-result" className={CARD}>
      <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-2">
        <h3 id="stream-ed-result" className={LABEL}>
          {live ? t(locale, "streamSepolia.ed.ifClosedNow") : t(locale, "streamSepolia.ed.final")}
        </h3>
      </div>
      {count > 0 && clearing ? (
        <>
          <p className="tw-m-0 tw-mt-2 tw-text-3xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
            {t(locale, "streamSepolia.ed.result", {
              count: formatCount(count, locale),
              price: formatEth(clearing.price, locale),
            })}
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
            {t(locale, "streamSepolia.ed.raised", {
              revenue: formatEth(clearing.revenue, locale),
              artist: formatEth(clearing.revenue - clearing.networkFee, locale),
              network: formatEth(clearing.networkFee, locale),
            })}
          </p>
        </>
      ) : (
        <p className="tw-m-0 tw-mt-2 tw-text-3xl tw-font-semibold tw-text-iron-50">
          {live ? t(locale, "streamSepolia.ed.noBidsYet") : t(locale, "streamSepolia.ed.noneMade")}
        </p>
      )}
      {detail.sale.maxCount > 0 ? (
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
          {t(locale, "streamSepolia.ed.cap", { cap: formatCount(detail.sale.maxCount, locale) })}
        </p>
      ) : null}
      <div className="tw-mt-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-3">
        <CloseLine detail={detail} view={view} />
      </div>
    </section>
  );
}

function CloseLine({ detail, view }: { readonly detail: EditionDetail; readonly view: EditionView }) {
  const locale = useBrowserLocale();
  const minutes = Math.round(detail.sale.terms.softWindow / 60);
  if (view.screen === "open" || view.screen === "closing") {
    return (
      <>
        <p className="tw-m-0 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
          {t(locale, "streamSepolia.ed.closes", {
            time: formatClock(detail.endTimes.endTime, locale),
            left: formatDuration(view.secondsLeft, locale),
          })}
        </p>
        <p className={`tw-m-0 tw-mt-1 tw-text-sm ${view.screen === "closing" ? "tw-text-amber-300" : "tw-text-iron-500"}`}>
          {view.screen === "closing"
            ? t(locale, "streamSepolia.ed.closingRule", { minutes })
            : t(locale, "streamSepolia.ed.closeRule", { minutes })}
        </p>
      </>
    );
  }
  return <p className="tw-m-0 tw-text-sm tw-text-iron-300">{t(locale, statusKey(view))}</p>;
}

function statusKey(view: EditionView): MessageKey {
  if (view.screen === "closed") {
    return view.canSettle ? "streamSepolia.ed.status.closed" : "streamSepolia.ed.status.closedWaiting";
  }
  if (view.screen === "settling") return "streamSepolia.ed.status.settling";
  if (view.screen === "void") return "streamSepolia.ed.status.void";
  return "streamSepolia.ed.status.settled";
}


function Book({
  detail,
  clearingStep,
}: {
  readonly detail: EditionDetail;
  readonly clearingStep: number | null;
}) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const rationed = detail.clearing?.rationed ?? false;
  const rows = [...detail.bids]
    .filter((bid) => !bid.claimed || detail.sale.status >= 4)
    .sort((a, b) => b.step - a.step || Number(a.bidId - b.bidId));
  if (rows.length === 0) {
    return (
      <section aria-labelledby="stream-ed-book" className={CARD}>
        <h3 id="stream-ed-book" className={LABEL}>{t(locale, "streamSepolia.ed.bids")}</h3>
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-500">{t(locale, "streamSepolia.ed.bidsEmpty")}</p>
      </section>
    );
  }
  const lineIndex =
    clearingStep === null ? -1 : rows.findIndex((row) => row.step < clearingStep);
  const count = Number(detail.clearing?.count ?? 0n);
  const priceLine =
    clearingStep !== null && detail.clearing ? (
      <tr>
        <td colSpan={4} className="tw-px-0 tw-py-2">
          <div className="tw-flex tw-items-center tw-gap-3 tw-text-[13px] tw-font-semibold tw-text-emerald-400">
            <span className="tw-whitespace-nowrap">
              {t(locale, "streamSepolia.ed.priceLine", {
                count: formatCount(count, locale),
                price: formatEth(detail.clearing.price, locale),
              })}
            </span>
            <span aria-hidden="true" className="tw-h-0.5 tw-flex-1 tw-rounded tw-bg-emerald-400" />
          </div>
        </td>
      </tr>
    ) : null;
  return (
    <section aria-labelledby="stream-ed-book" className={CARD}>
      <h3 id="stream-ed-book" className={LABEL}>{t(locale, "streamSepolia.ed.bids")}</h3>
      <div className="tw-mt-3 tw-overflow-x-auto">
        <table className="tw-w-full tw-border-collapse tw-text-sm">
          <thead>
            <tr>
              {(["price", "editions", "bidder", "standing"] as const).map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={`tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-pb-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 ${
                    index === 3 ? "tw-text-right" : "tw-pr-3 tw-text-left"
                  }`}
                >
                  {t(locale, `streamSepolia.ed.col.${column}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const standing = bidStanding({ step: row.step, clearingStep, rationed });
              const mine = sameAddress(row.bidder, wallet.address);
              return (
                <Fragment key={row.bidId.toString()}>
                  {index === lineIndex ? priceLine : null}
                  <tr className={standing === "out" ? "tw-text-iron-500" : "tw-text-iron-200"}>
                    <td className="tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-py-2 tw-pr-3 tw-font-semibold tw-tabular-nums">
                      {formatEth(detail.prices[row.step] ?? 0n, locale)}
                    </td>
                    <td className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-py-2 tw-pr-3 tw-tabular-nums">
                      {formatCount(row.quantity, locale)}
                    </td>
                    <td className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-py-2 tw-pr-3">
                      {mine ? (
                        <span className="tw-font-semibold tw-text-primary-300">{t(locale, "streamSepolia.you")}</span>
                      ) : (
                        <span className="tw-font-mono tw-text-xs">{shortAddress(row.bidder)}</span>
                      )}
                    </td>
                    <td className={`tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-py-2 tw-text-right tw-text-xs tw-font-bold ${STANDING_TONE[standing]}`}>
                      {standingLabel(standing, locale)}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
            {lineIndex === -1 ? priceLine : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WhyThisMany({ detail }: { readonly detail: EditionDetail }) {
  const locale = useBrowserLocale();
  const { candidates, bestRevenue, pick } = useMemo(
    () =>
      clearingCandidates({
        prices: detail.prices,
        unitsByStep: unitsByStepFrom(detail.lowStep, detail.unitsByStep),
        cap: detail.sale.maxCount,
        marginShare: detail.sale.terms.marginShare,
      }),
    [detail]
  );
  if (candidates.length < 2 || bestRevenue === 0n) return null;
  const margin = Math.round(detail.sale.terms.marginShare / 1000);
  return (
    <section aria-labelledby="stream-ed-why" className={CARD}>
      <h3 id="stream-ed-why" className={LABEL}>{t(locale, "streamSepolia.ed.why")}</h3>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
        {t(locale, "streamSepolia.ed.whyRule", { margin })}
      </p>
      <ul className="tw-m-0 tw-mt-4 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
        {candidates.map((candidate, index) => {
          const width = Number((candidate.revenue * 1000n) / bestRevenue) / 10;
          const picked = index === pick;
          return (
            <li
              key={candidate.step}
              className="tw-grid tw-grid-cols-[minmax(0,10em)_minmax(2.5rem,1fr)_auto] tw-items-center tw-gap-3 tw-text-[13px] sm:tw-text-sm"
            >
              <span className={`tw-whitespace-nowrap tw-tabular-nums ${picked ? "tw-font-semibold tw-text-iron-50" : "tw-text-iron-300"}`}>
                {t(locale, "streamSepolia.ed.candidate", {
                  count: formatCount(candidate.count, locale),
                  price: formatEth(candidate.price, locale),
                })}
              </span>
              <span className="tw-relative tw-h-2.5 tw-rounded-sm tw-bg-white/[0.04]" aria-hidden="true">
                <span
                  className={`tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-sm ${picked ? "tw-bg-emerald-400" : "tw-bg-white/[0.16]"}`}
                  style={{ width: `${width}%` }}
                />
              </span>
              <span className={`tw-text-right tw-tabular-nums ${picked ? "tw-font-semibold tw-text-iron-50" : "tw-text-iron-300"}`}>
                {t(locale, "streamSepolia.ed.candidateEth", { revenue: formatEth(candidate.revenue, locale) })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function quoteLine(won: number, quantity: number, locale: SupportedLocale): string {
  if (won >= quantity) {
    return t(locale, "streamSepolia.ed.quoteIn", { count: formatCount(quantity, locale) });
  }
  if (won > 0) {
    return t(locale, "streamSepolia.ed.quotePart", {
      won: formatCount(won, locale),
      count: formatCount(quantity, locale),
    });
  }
  return t(locale, "streamSepolia.ed.quoteOut");
}

function BidComposer({ detail }: { readonly detail: EditionDetail }) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const prices = detail.prices;
  const startStep = detail.clearing && detail.clearing.count > 0n ? Number(detail.clearing.step) : 0;
  const [step, setStep] = useState(startStep);
  // Typed text shows until it is committed to a ladder step; then the step's price shows.
  const [typedPrice, setTypedPrice] = useState<string | null>(null);
  const priceText = typedPrice ?? formatEth(prices[step] ?? 0n, "en-US").replace(/,/g, "");
  const [quantity, setQuantity] = useState(1);
  const quote = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, "quote", detail.saleId.toString(), step, quantity],
    queryFn: () => quoteEditionBid(detail.auctionAddress, detail.saleId, step, quantity),
    enabled: quantity > 0,
  });
  const cost = (prices[step] ?? 0n) * BigInt(quantity);
  const won = quote.data ? Number(quote.data.unitsWon) : null;
  const priceId = `stream-ed-price-${detail.saleId.toString().slice(0, 6)}`;
  const qtyId = `stream-ed-qty-${detail.saleId.toString().slice(0, 6)}`;
  const commitPrice = () => {
    const value = Number(priceText.replace(",", "."));
    setTypedPrice(null);
    if (!Number.isFinite(value) || value <= 0) return;
    setStep(nearestStep(prices, BigInt(Math.round(value * 1e9)) * 1_000_000_000n));
  };
  return (
    <section aria-labelledby="stream-ed-bid" className={CARD}>
      <h3 id="stream-ed-bid" className={LABEL}>{t(locale, "streamSepolia.ed.placeBid")}</h3>
      <WalletGate reason={t(locale, "streamSepolia.ed.connectToBid")}>
        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
          <div>
            <label htmlFor={priceId} className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-iron-200">
              {t(locale, "streamSepolia.ed.pricePer")}
            </label>
            <div className={STEPPER}>
              <button type="button" className={STEPPER_BUTTON} disabled={step <= 0} aria-label={t(locale, "streamSepolia.ed.stepDown")} onClick={() => {
                setTypedPrice(null);
                setStep((s) => Math.max(0, s - 1));
              }}>−</button>
              <input
                id={priceId}
                className={STEPPER_INPUT}
                inputMode="decimal"
                autoComplete="off"
                value={priceText}
                onChange={(event) => setTypedPrice(event.target.value)}
                onBlur={commitPrice}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitPrice();
                }}
              />
              <button type="button" className={STEPPER_BUTTON} disabled={step >= prices.length - 1} aria-label={t(locale, "streamSepolia.ed.stepUp")} onClick={() => {
                setTypedPrice(null);
                setStep((s) => Math.min(prices.length - 1, s + 1));
              }}>+</button>
            </div>
          </div>
          <div>
            <label htmlFor={qtyId} className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-iron-200">
              {t(locale, "streamSepolia.ed.editions")}
            </label>
            <div className={STEPPER}>
              <button type="button" className={STEPPER_BUTTON} disabled={quantity <= 1} aria-label={t(locale, "streamSepolia.ed.fewer")} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <input
                id={qtyId}
                className={STEPPER_INPUT}
                inputMode="numeric"
                autoComplete="off"
                value={quantity}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  setQuantity(Number.isFinite(next) && next > 0 ? Math.min(next, 10_000) : 1);
                }}
              />
              <button type="button" className={STEPPER_BUTTON} aria-label={t(locale, "streamSepolia.ed.more")} onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
          </div>
          <div aria-live="polite" className="tw-rounded-lg tw-bg-white/[0.04] tw-p-3 tw-text-sm tw-text-iron-300">
            <p className="tw-m-0 tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {t(locale, "streamSepolia.ed.youPay", { amount: formatEth(cost, locale) })}
            </p>
            {won !== null ? (
              <p className="tw-m-0 tw-mt-1">
                {quoteLine(won, quantity, locale)}
              </p>
            ) : null}
          </div>
          <TxAction
            fullWidth
            label={t(locale, "streamSepolia.ed.bid")}
            request={() =>
              wallet.address
                ? {
                    address: detail.auctionAddress,
                    abi,
                    functionName: "bid",
                    args: [detail.saleId, BigInt(step), BigInt(quantity)],
                    value: cost,
                  }
                : null
            }
          />
          <p className="tw-m-0 tw-text-xs tw-text-iron-500">{t(locale, "streamSepolia.ed.fine")}</p>
        </div>
      </WalletGate>
    </section>
  );
}

function useBidOutcomes(detail: EditionDetail, bids: readonly EditionBidRow[], enabled: boolean) {
  return useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, "outcomes", detail.saleId.toString(), bids.map((b) => b.bidId.toString()).join(",")],
    enabled: enabled && bids.length > 0,
    queryFn: () =>
      Promise.all(
        bids.map((bid) =>
          getStreamClient().readContract({
            address: detail.auctionAddress,
            abi: editionAuctionAbi,
            functionName: "bidOutcome",
            args: [detail.saleId, bid.bidId],
          })
        )
      ),
  });
}

function YourBids({
  detail,
  view,
  clearingStep,
}: {
  readonly detail: EditionDetail;
  readonly view: EditionView;
  readonly clearingStep: number | null;
}) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const mine = detail.bids.filter((bid) => sameAddress(bid.bidder, wallet.address));
  const open = mine.filter((bid) => !bid.claimed);
  const outcomes = useBidOutcomes(detail, open, view.canClaim);
  if (mine.length === 0) return null;
  const rationed = detail.clearing?.rationed ?? false;
  const held = open.reduce((sum, bid) => sum + (detail.prices[bid.step] ?? 0n) * BigInt(bid.quantity), 0n);
  return (
    <section aria-labelledby="stream-ed-yours" className={CARD}>
      <h3 id="stream-ed-yours" className={LABEL}>{t(locale, "streamSepolia.ed.yourBids")}</h3>
      {open.length > 0 && !view.canClaim ? (
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-300">
          {t(locale, "streamSepolia.ed.held", { amount: formatEth(held, locale) })}
        </p>
      ) : null}
      <ul className="tw-m-0 tw-mt-3 tw-list-none tw-p-0">
        {mine.map((bid, index) => {
          const standing = bidStanding({ step: bid.step, clearingStep, rationed });
          const outcome = outcomes.data?.[open.indexOf(bid)];
          return (
            <li key={bid.bidId.toString()} className="tw-flex tw-flex-col tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-3">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-text-sm">
                <span className="tw-font-semibold tw-tabular-nums tw-text-iron-50">
                  {t(locale, "streamSepolia.ed.bidRow", {
                    count: formatCount(bid.quantity, locale),
                    price: formatEth(detail.prices[bid.step] ?? 0n, locale),
                  })}
                </span>
                {bid.claimed ? (
                  <span className="tw-text-xs tw-text-iron-400">
                    {t(locale, "streamSepolia.ed.claimedRow", {
                      won: formatCount(bid.unitsWon ?? 0n, locale),
                      refund: formatEth(bid.refund ?? 0n, locale),
                    })}
                  </span>
                ) : null}
                {!bid.claimed && !view.canClaim ? (
                  <span className={`tw-text-xs tw-font-bold ${STANDING_TONE[standing]}`}>{standingLabel(standing, locale)}</span>
                ) : null}
              </div>
              {!bid.claimed && view.canClaim ? (
                <TxAction
                  variant="action"
                  label={t(locale, "streamSepolia.ed.claim")}
                  description={
                    outcome
                      ? t(locale, "streamSepolia.ed.claimHelp", {
                          won: formatCount(outcome.unitsWon, locale),
                          refund: formatEth(outcome.refund, locale),
                        })
                      : undefined
                  }
                  request={() =>
                    wallet.address
                      ? {
                          address: detail.auctionAddress,
                          abi,
                          functionName: "claimBid",
                          args: [detail.saleId, bid.bidId, wallet.address],
                        }
                      : null
                  }
                />
              ) : null}
              {!bid.claimed && view.canBid && standing !== "in" ? (
                <RaiseAction detail={detail} bid={bid} key={`raise-${index}`} />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RaiseAction({ detail, bid }: { readonly detail: EditionDetail; readonly bid: EditionBidRow }) {
  const locale = useBrowserLocale();
  const target = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, "raise", detail.saleId.toString(), bid.bidId.toString(), bid.step],
    queryFn: () =>
      getStreamClient().readContract({
        address: detail.auctionAddress,
        abi: editionAuctionAbi,
        functionName: "lowestWinningStep",
        args: [detail.saleId, BigInt(bid.quantity)],
      }),
  });
  if (!target.data?.[0]) return null;
  const step = Math.max(Number(target.data[1]), bid.step + 1);
  const extra = ((detail.prices[step] ?? 0n) - (detail.prices[bid.step] ?? 0n)) * BigInt(bid.quantity);
  return (
    <TxAction
      variant="secondary"
      label={t(locale, "streamSepolia.ed.raise", { price: formatEth(detail.prices[step] ?? 0n, locale) })}
      description={t(locale, "streamSepolia.ed.raiseHelp", { amount: formatEth(extra, locale) })}
      request={() => ({
        address: detail.auctionAddress,
        abi,
        functionName: "raise",
        args: [detail.saleId, bid.bidId, BigInt(step)],
        value: extra,
      })}
    />
  );
}

function SettleAction({ detail, view }: { readonly detail: EditionDetail; readonly view: EditionView }) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  if (!view.canSettle && !view.canAbandon) return null;
  return (
    <section className={CARD}>
      <WalletGate reason={t(locale, "streamSepolia.one.connectToAct")}>
        <div className="tw-flex tw-flex-col tw-gap-4">
          {view.canSettle ? (
            <TxAction
              fullWidth
              label={view.screen === "settling" ? t(locale, "streamSepolia.ed.continueSettle") : t(locale, "streamSepolia.ed.settle")}
              description={t(locale, "streamSepolia.ed.settleHelp")}
              request={async () => {
                if (!wallet.address) return null;
                const client = getStreamClient();
                const order =
                  view.screen === "settling"
                    ? await client.readContract({
                        address: detail.auctionAddress,
                        abi: editionAuctionAbi,
                        functionName: "settlementOrderFor",
                        args: [detail.saleId, wallet.address],
                      })
                    : await client.readContract({
                        address: detail.auctionAddress,
                        abi: editionAuctionAbi,
                        functionName: "settlementOrder",
                        args: [detail.saleId],
                      });
                return { address: detail.auctionAddress, abi, functionName: "settle", args: [detail.saleId, order] };
              }}
            />
          ) : null}
          {view.canAbandon ? (
            <TxAction
              fullWidth
              variant="secondary"
              label={t(locale, "streamSepolia.ed.abandon")}
              description={t(locale, "streamSepolia.ed.abandonHelp")}
              request={() => ({ address: detail.auctionAddress, abi, functionName: "abandon", args: [detail.saleId] })}
            />
          ) : null}
        </div>
      </WalletGate>
    </section>
  );
}

function OpenEdition({
  detail,
  tokenId,
  firstStartTx,
  curated,
}: {
  readonly detail: EditionDetail;
  readonly tokenId: bigint;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <section className={CARD}>
      <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">{t(locale, "streamSepolia.ed.notOpen")}</p>
      <div className="tw-mt-3">
        <WalletGate reason={t(locale, "streamSepolia.one.connectToAct")}>
          <TxAction
            label={t(locale, "streamSepolia.ed.open")}
            description={t(locale, "streamSepolia.ed.openHelp")}
            request={async () => {
              if (!firstStartTx) return null;
              const started = await readStartItem(firstStartTx, curated);
              if (!started) return null;
              return {
                address: detail.auctionAddress,
                abi,
                functionName: "open",
                args: [detail.editionsToken, tokenId, encodeEditionOpenData(started.item, curated)],
              };
            }}
          />
        </WalletGate>
      </div>
    </section>
  );
}

export function EditionPanel({
  detail,
  tokenId,
  firstStartTx,
  curated,
  masterOpen,
  productLabel,
}: {
  readonly detail: EditionDetail;
  readonly tokenId: bigint;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
  /** The 1/1 is running now, so an edition sale may still be opened beside it. */
  readonly masterOpen: boolean;
  readonly productLabel: string;
}) {
  const now = useNow();
  const view = editionView({
    status: detail.sale.status,
    bidCount: detail.sale.bidCount,
    endTime: detail.endTimes.endTime,
    biddingOpen: detail.endTimes.biddingOpen,
    oneOfOneState: detail.endTimes.oneOfOneState,
    now,
    softWindow: detail.sale.terms.softWindow,
    contractPaused: detail.contractPaused,
    abandonable: detail.abandonable,
    masterOpenForEditions: masterOpen,
  });
  const clearingStep =
    detail.clearing && detail.clearing.count > 0n ? Number(detail.clearing.step) : null;
  return (
    <section aria-label={productLabel} className="tw-mt-10">
      <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">{productLabel}</h2>
      {view.screen === "openable" ? (
        <div className="tw-mt-4">
          <OpenEdition detail={detail} tokenId={tokenId} firstStartTx={firstStartTx} curated={curated} />
        </div>
      ) : null}
      {view.screen === "openable" || view.screen === "not_open" ? null : (
        // Phones: one column, the numbers and the bid box first. Desktop: two columns.
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4 lg:tw-grid lg:tw-grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:tw-items-start lg:tw-gap-5">
          <div className="tw-contents lg:tw-flex lg:tw-flex-col lg:tw-gap-5">
            <div className="tw-order-1 lg:tw-order-none">
              <Result detail={detail} view={view} live={view.canBid} />
            </div>
            <div className="tw-order-5 lg:tw-order-none">
              <Book detail={detail} clearingStep={clearingStep} />
            </div>
            <div className="tw-order-6 empty:tw-hidden lg:tw-order-none">
              <WhyThisMany detail={detail} />
            </div>
          </div>
          <div className="tw-contents lg:tw-flex lg:tw-flex-col lg:tw-gap-5">
            <div className="tw-order-2 empty:tw-hidden lg:tw-order-none">
              <YourBids detail={detail} view={view} clearingStep={clearingStep} />
            </div>
            {view.canBid ? (
              <div className="tw-order-3 lg:tw-order-none">
                <BidComposer detail={detail} />
              </div>
            ) : null}
            <div className="tw-order-4 empty:tw-hidden lg:tw-order-none">
              <SettleAction detail={detail} view={view} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
