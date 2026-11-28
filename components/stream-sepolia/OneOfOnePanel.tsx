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
import { isZeroAddress, oneOfOneView, type OneOfOneView } from "@/lib/stream/state";

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

function headline(view: OneOfOneView, detail: OneOfOneDetail, locale: SupportedLocale) {
  const bid = formatEth(detail.auction.bid, locale);
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
      return {
        left: {
          label: view.hasBid ? t(locale, "streamSepolia.one.winningBid") : t(locale, "streamSepolia.one.result"),
          value: view.hasBid ? `${bid} ETH` : t(locale, "streamSepolia.one.noBidsShort"),
        },
        right: { label: t(locale, "streamSepolia.one.timeLeft"), value: t(locale, "streamSepolia.one.endedShort") },
      };
    case "unsold_museum":
    case "unsold_waiting":
    case "unsold_restartable":
      return {
        left: { label: t(locale, "streamSepolia.one.result"), value: t(locale, "streamSepolia.one.unsold") },
        right: null,
      };
    case "paused":
    case "cancelled":
    case "not_started":
      return {
        left: {
          label: view.hasBid ? t(locale, "streamSepolia.one.topBid") : t(locale, "streamSepolia.one.result"),
          value: view.hasBid ? `${bid} ETH` : t(locale, "streamSepolia.one.noBidsShort"),
        },
        right: null,
      };
  }
}

function StatusLine({ view, detail }: { readonly view: OneOfOneView; readonly detail: OneOfOneDetail }) {
  const locale = useBrowserLocale();
  const end = formatClock(detail.auction.endTime, locale);
  const window = Math.round(detail.extensionWindow / 60);
  let text: string;
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
      text = t(locale, "streamSepolia.one.status.ended");
      break;
    case "sold":
      text = t(locale, "streamSepolia.one.status.sold");
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
  // A sale that ended with no buyer for another reason says so instead of "No one bid".
  if (view.screen.startsWith("unsold_") && detail.closedHow) {
    text = t(locale, detail.closedHow === "rescued" ? "streamSepolia.one.status.rescued" : "streamSepolia.one.status.refused");
  } else if (view.screen.startsWith("unsold_") && detail.bids.length > 0) {
    // Bids but no buyer and neither event: the collection was no longer listed at the end.
    text = t(locale, "streamSepolia.one.status.delisted");
  }
  return (
    <p className={`tw-m-0 tw-text-sm ${view.screen === "closing" ? "tw-text-amber-300" : "tw-text-iron-300"}`}>
      {view.halted && view.screen.startsWith("unsold_") ? t(locale, "streamSepolia.one.status.halted") : text}
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

function Actions({ view, detail }: { readonly view: OneOfOneView; readonly detail: OneOfOneDetail }) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const address = getStreamInstance().addresses.englishAuction;
  // Calls anyone may make on this sale, checked against the auction's ABI.
  const anyone = (functionName: "settle" | "settleOrRefund" | "restart" | "withdrawBid") => () =>
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
        description={t(locale, "streamSepolia.one.withdrawBidHelp")}
        request={anyone("withdrawBid")}
      />
    );
  }
  if (view.canClaimDelivery && wallet.address) {
    actions.push(
      <TxAction
        key="delivery"
        fullWidth
        label={t(locale, "streamSepolia.one.claimDelivery")}
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
      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-4">
        <Figure label={top.left.label} value={top.left.value} />
        {top.right ? <Figure label={top.right.label} value={top.right.value} /> : null}
      </div>
      <div className="tw-mt-3">
        <StatusLine view={view} detail={detail} />
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
        <Actions view={view} detail={detail} />
      </div>
      <BidHistory detail={detail} />
    </section>
  );
}
