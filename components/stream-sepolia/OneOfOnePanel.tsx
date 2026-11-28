"use client";

import { darkInputClassName } from "@/components/utils/input/dark-input-styles";
import { englishAuctionAbi } from "@/lib/stream/abis";
import { useState } from "react";
import { formatEther, parseEther, type Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { getStreamInstance } from "@/lib/stream/instances";
import type { OneOfOneDetail } from "@/lib/stream/reads";
import { isZeroAddress, oneOfOneView, sameAddress, type OneOfOneView } from "@/lib/stream/state";

import { formatClock, formatDuration, formatEth, sepoliaTxUrl } from "./format";
import { StreamIdentity } from "./StreamIdentity";
import { streamTx } from "@/lib/stream/streamTx";

import { TxAction } from "./TxAction";
import { useNow } from "./useStreamData";
import { useStreamWallet, WalletGate } from "./WalletGate";

export const LABEL =
  "tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500";
export const CARD =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-4 sm:tw-p-5";
const LINK =
  "tw-text-iron-200 tw-underline tw-decoration-white/20 tw-underline-offset-4 hover:tw-text-white";
const INPUT = `${darkInputClassName} tw-h-12 tw-text-lg tw-font-semibold tw-tabular-nums`;


function Figure({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <p className="tw-m-0 tw-mt-1 tw-text-3xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl xl:tw-text-5xl">
        {value}
      </p>
    </div>
  );
}

/**
 * The big figures: a live bid and countdown, a winning bid, or the sold price.
 * Null when there is no such figure (no bids, unsold, paused): then the state
 * leads in plain words at normal size instead of a non-event in large type.
 */
function headline(view: OneOfOneView, detail: OneOfOneDetail, locale: SupportedLocale) {
  const bid = formatEth(detail.auction.bid, locale);
  if (!view.hasBid && view.screen !== "live" && view.screen !== "closing") return null;
  switch (view.screen) {
    case "live":
    case "closing":
      return {
        left: {
          label: view.hasBid ? t(locale, "streamSepolia.one.topBid") : t(locale, "streamSepolia.one.openingBid"),
          value: `${view.hasBid ? bid : formatEth(detail.minimumBid ?? 0n, locale)} ETH`,
        },
        right: { label: t(locale, "streamSepolia.one.timeLeft"), value: formatDuration(view.secondsLeft, locale) },
      };
    case "sold":
      return {
        left: { label: t(locale, "streamSepolia.one.soldFor"), value: `${bid} ETH` },
        right: null,
      };
    case "ending":
    case "ended":
      return { left: { label: t(locale, "streamSepolia.one.winningBid"), value: `${bid} ETH` }, right: null };
    case "unsold_museum":
    case "unsold_waiting":
    case "unsold_restartable":
      return null;
    case "paused":
    case "cancelled":
    case "not_started":
      return { left: { label: t(locale, "streamSepolia.one.topBid"), value: `${bid} ETH` }, right: null };
  }
}

/** Why a sale ended with no buyer, when the chain says more than "No one bid". */
function noBuyerText(view: OneOfOneView, detail: OneOfOneDetail, locale: SupportedLocale): string | null {
  const unsold = view.screen.startsWith("unsold_");
  if (view.halted && unsold) return t(locale, "streamSepolia.one.status.halted");
  // On r9 a rescued sale ends cancelled; on r8 it ended settled with no buyer.
  if ((unsold || view.screen === "cancelled") && detail.closedHow) {
    return t(locale, detail.closedHow === "rescued" ? "streamSepolia.one.status.rescued" : "streamSepolia.one.status.refused");
  }
  // Bids but no buyer and neither event (most likely a delisted collection): say only what the chain proves.
  if (unsold && detail.bids.length > 0) return t(locale, "streamSepolia.one.status.delisted");
  return null;
}

function StatusLine({
  view,
  detail,
  lead = false,
}: {
  readonly view: OneOfOneView;
  readonly detail: OneOfOneDetail;
  /** No big figure above: the state itself leads, a little larger. */
  readonly lead?: boolean;
}) {
  const locale = useBrowserLocale();
  const end = formatClock(detail.auction.endTime, locale);
  const window = Math.round(detail.extensionWindow / 60);
  let text: string | null;
  switch (view.screen) {
    case "live":
      text = t(locale, "streamSepolia.one.status.live", { end, minutes: window });
      break;
    case "closing":
      text = t(locale, "streamSepolia.one.status.closing", { minutes: window });
      break;
    case "ending":
      text = t(locale, "streamSepolia.one.status.ending");
      break;
    case "ended":
      text = view.hasBid ? t(locale, "streamSepolia.one.status.ended") : t(locale, "streamSepolia.one.status.endedNoBids");
      break;
    case "sold":
      // The headline already says "Sold for"; the owner line follows.
      text = null;
      break;
    case "unsold_museum":
      text = t(locale, "streamSepolia.one.status.museum");
      break;
    case "unsold_waiting":
      text = t(locale, "streamSepolia.one.status.unsoldWaiting", {
        time: formatClock(view.restartAt ?? 0, locale),
      });
      break;
    case "unsold_restartable":
      text = t(locale, "streamSepolia.one.status.unsoldRestartable");
      break;
    case "paused":
      text = t(locale, "streamSepolia.one.status.paused");
      break;
    case "cancelled":
      text = t(locale, "streamSepolia.one.status.cancelled");
      break;
    case "not_started":
      text = t(locale, "streamSepolia.one.status.notStarted");
  }
  const shown = noBuyerText(view, detail, locale) ?? text;
  if (!shown) return null;
  return (
    <p
      className={`tw-m-0 ${lead ? "tw-text-base tw-font-semibold tw-text-iron-100" : "tw-text-sm"} ${
        !lead && view.screen === "closing" ? "tw-text-amber-300" : ""
      } ${lead ? "" : "tw-text-iron-300"}`}
    >
      {shown}
    </p>
  );
}

function BidBox({ detail }: { readonly detail: OneOfOneDetail }) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const minimum = detail.minimumBid ?? 0n;
  // The box shows the minimum until the bidder types; a typed value stays.
  const [typed, setTyped] = useState<string | null>(null);
  // The exact minimum, never rounded: a rounded figure can fall below it.
  const value = typed ?? formatEther(minimum);
  let amount: bigint | null = null;
  try {
    amount = value ? parseEther(value.replace(",", ".")) : null;
  } catch {
    amount = null;
  }
  const tooLow = amount !== null && amount < minimum;
  const inputId = `stream-bid-${detail.saleId.toString().slice(0, 8)}`;
  return (
    <WalletGate reason={t(locale, "streamSepolia.one.connectToBid")}>
      <div>
        <label htmlFor={inputId} className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-iron-200">
          {t(locale, "streamSepolia.one.yourBid")}
        </label>
        <div className="tw-relative">
          <input
            id={inputId}
            className={INPUT}
            inputMode="decimal"
            autoComplete="off"
            value={value}
            aria-describedby={`${inputId}-hint`}
            onChange={(event) => setTyped(event.target.value)}
          />
          <span className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-sm tw-text-iron-500">
            ETH
          </span>
        </div>
        <p id={`${inputId}-hint`} className={`tw-mb-3 tw-mt-1.5 tw-text-xs ${tooLow ? "tw-text-red" : "tw-text-iron-500"}`}>
          {t(locale, "streamSepolia.one.minimum", { amount: formatEther(minimum) })}
        </p>
        <TxAction
          label={t(locale, "streamSepolia.one.bid")}
          doneText={amount === null ? undefined : t(locale, "streamSepolia.one.bidDone", { amount: formatEther(amount) })}
          fullWidth
          disabled={amount === null || tooLow}
          description={
            amount !== null && !tooLow
              ? t(locale, "streamSepolia.one.bidCost", { amount: formatEther(amount) })
              : undefined
          }
          request={() => {
            return amount === null || !wallet.address
              ? null
              : streamTx({
                  address: getStreamInstance().addresses.englishAuction,
                  abi: englishAuctionAbi,
                  functionName: "bid",
                  args: [detail.saleId, wallet.address],
                  value: amount,
                });
          }}
        />
      </div>
    </WalletGate>
  );
}

function Actions({
  view,
  detail,
  owner,
}: {
  readonly view: OneOfOneView;
  readonly detail: OneOfOneDetail;
  readonly owner: Address | null;
}) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const address = getStreamInstance().addresses.englishAuction;
  // Calls anyone may make on this sale, checked against the auction's ABI.
  const anyone = (
    functionName: "settle" | "settleOrRefund" | "restart" | "withdrawBid" | "sendRescuedToMuseum"
  ) => () =>
    streamTx({ address, abi: englishAuctionAbi, functionName, args: [detail.saleId] });
  const actions = [];
  if (view.canSettle) {
    actions.push(
      <TxAction
        key="settle"
        fullWidth
        label={t(locale, "streamSepolia.one.settle")}
        doneText={t(locale, "streamSepolia.one.settleDone")}
        description={
          view.hasBid
            ? t(locale, "streamSepolia.one.settleSoldHelp")
            : t(locale, "streamSepolia.one.settleUnsoldHelp")
        }
        request={anyone("settle")}
      />
    );
  }
  if (view.canSettleOrRefund) {
    actions.push(
      <TxAction
        key="settleOrRefund"
        fullWidth
        variant="secondary"
        label={t(locale, "streamSepolia.one.settleOrRefund")}
        doneText={t(locale, "streamSepolia.one.settleOrRefundDone")}
        description={t(locale, "streamSepolia.one.settleOrRefundHelp")}
        request={anyone("settleOrRefund")}
      />
    );
  }
  if (view.canRestart) {
    actions.push(
      <TxAction
        key="restart"
        fullWidth
        label={t(locale, "streamSepolia.one.restart")}
        doneText={t(locale, "streamSepolia.one.restartDone")}
        description={t(locale, "streamSepolia.one.restartHelp", {
          duration: formatDuration(detail.duration, locale),
        })}
        request={anyone("restart")}
      />
    );
  }
  if (view.canWithdrawBid) {
    actions.push(
      <TxAction
        key="withdraw"
        fullWidth
        variant="secondary"
        label={t(locale, "streamSepolia.one.withdrawBid")}
        doneText={t(locale, "streamSepolia.one.withdrawBidDone")}
        description={t(locale, "streamSepolia.one.withdrawBidHelp")}
        request={anyone("withdrawBid")}
      />
    );
  }
  // A rescued work the auction still holds can only leave for the museum; anyone may send it.
  if (getStreamInstance().rescuedToMuseum && detail.closedHow === "rescued" && sameAddress(owner, address)) {
    actions.push(
      <TxAction
        key="museum"
        fullWidth
        variant="secondary"
        label={t(locale, "streamSepolia.one.toMuseum")}
        description={t(locale, "streamSepolia.one.toMuseumHelp")}
        doneText={t(locale, "streamSepolia.one.toMuseumDone")}
        request={anyone("sendRescuedToMuseum")}
      />
    );
  }
  if (view.canClaimDelivery && wallet.address) {
    actions.push(
      <TxAction
        key="delivery"
        fullWidth
        label={t(locale, "streamSepolia.one.claimDelivery")}
        doneText={t(locale, "streamSepolia.one.claimDeliveryDone")}
        description={t(locale, "streamSepolia.one.claimDeliveryHelp")}
        request={() =>
          streamTx({
            address,
            abi: englishAuctionAbi,
            functionName: "claimDelivery",
            args: [detail.saleId, wallet.address!],
          })
        }
      />
    );
  }
  if (actions.length === 0) return null;
  return (
    <WalletGate reason={t(locale, "streamSepolia.one.connectToAct")}>
      <div className="tw-flex tw-flex-col tw-gap-4">{actions}</div>
    </WalletGate>
  );
}

function BidHistory({ detail }: { readonly detail: OneOfOneDetail }) {
  const locale = useBrowserLocale();
  if (detail.bids.length === 0) return null;
  return (
    <section aria-labelledby="stream-bid-history" className="tw-mt-6">
      <h3 id="stream-bid-history" className={LABEL}>
        {t(locale, "streamSepolia.one.history")}
      </h3>
      <ol className="tw-m-0 tw-mt-2 tw-list-none tw-p-0">
        {detail.bids.map((bid) => (
          <li
            key={bid.transactionHash}
            className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-2.5 tw-text-sm"
          >
            <StreamIdentity address={bid.bidder} />
            <a
              href={sepoliaTxUrl(bid.transactionHash)}
              target="_blank"
              rel="noreferrer"
              className="tw-font-semibold tw-tabular-nums tw-text-iron-100 tw-no-underline hover:tw-underline"
            >
              {formatEth(bid.amount, locale)} ETH
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function OneOfOnePanel({
  detail,
  independent,
  owner,
}: {
  readonly detail: OneOfOneDetail;
  readonly independent: boolean;
  readonly owner: Address | null;
}) {
  const locale = useBrowserLocale();
  const now = useNow();
  const wallet = useStreamWallet();
  const view = oneOfOneView({
    state: detail.auction.state,
    bidder: detail.auction.bidder,
    bid: detail.auction.bid,
    endTime: detail.auction.endTime,
    pausedAt: detail.auction.pausedAt,
    restartedAt: detail.restartedAt,
    now,
    extensionWindow: detail.extensionWindow,
    restartDelay: detail.restartDelay,
    independent,
    contractPaused: detail.contractPaused,
    pendingDelivery: detail.pendingDelivery,
    refusableAt: detail.refusableAt,
    viewer: wallet.address,
  });
  const top = headline(view, detail, locale);
  // While the work waits to be claimed the auction holds it; the buyer is the owner that matters.
  const shownOwner =
    !isZeroAddress(detail.pendingDelivery) && detail.settlement ? detail.settlement.buyer : owner;
  return (
    <section aria-labelledby="stream-one-title" className={CARD}>
      <h2 id="stream-one-title" className={LABEL}>
        {t(locale, "streamSepolia.one.title")}
      </h2>
      {top ? (
        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-4">
          <Figure label={top.left.label} value={top.left.value} />
          {top.right ? <Figure label={top.right.label} value={top.right.value} /> : null}
        </div>
      ) : null}
      <div className="tw-mt-3">
        <StatusLine view={view} detail={detail} lead={!top} />
        {view.viewerLeads && (view.screen === "live" || view.screen === "closing") ? (
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-font-semibold tw-text-emerald-400">
            {t(locale, "streamSepolia.one.youLead")}
          </p>
        ) : null}
        {view.screen === "sold" && shownOwner ? (
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-300">
            {t(locale, "streamSepolia.one.owner")}{" "}
            <StreamIdentity address={shownOwner} />
            {detail.settlement ? (
              <>
                {" · "}
                <a href={sepoliaTxUrl(detail.settlement.transactionHash)} target="_blank" rel="noreferrer" className={LINK}>
                  {t(locale, "streamSepolia.tx.view")}
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      <div className="tw-mt-5 tw-flex tw-flex-col tw-gap-4">
        {view.canBid ? <BidBox detail={detail} /> : null}
        <Actions view={view} detail={detail} owner={owner} />
      </div>
      <BidHistory detail={detail} />
    </section>
  );
}
