"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Abi, Address } from "viem";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { splitLedgerAbi } from "@/lib/stream/generated/SplitLedger";
import { getStreamInstance } from "@/lib/stream/instances";
import { CURRENCY_ETH, ZERO_HASH } from "@/lib/stream/item";
import { readMyActivity, soloPayees, type MyOneOfOneBid } from "@/lib/stream/activity";
import type { SaleSummary } from "@/lib/stream/reads";
import { AUCTION_STATE, isZeroAddress } from "@/lib/stream/state";

import { formatCount, formatEth } from "./format";
import { CARD, LABEL } from "./OneOfOnePanel";
import { STREAM_BASE } from "./StreamNav";
import { TxAction } from "./TxAction";
import { useNow } from "./useStreamData";
import { WorkTitle } from "./WorkTitle";
import { useStreamWallet, WalletGate } from "./WalletGate";

const LINK = "tw-text-iron-100 tw-underline tw-decoration-white/20 tw-underline-offset-4 hover:tw-text-white";
const ROW =
  "tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-3 tw-text-sm";

function bidState(bid: MyOneOfOneBid, now: number, locale: SupportedLocale): { text: string; tone: string } {
  const running = bid.state === AUCTION_STATE.ACTIVE && Number(bid.endTime) > now;
  if (running) {
    return bid.leading
      ? { text: t(locale, "streamSepolia.me.leading"), tone: "tw-text-emerald-400" }
      : { text: t(locale, "streamSepolia.me.outbid"), tone: "tw-text-amber-300" };
  }
  if (bid.leading) {
    return bid.state === AUCTION_STATE.SETTLED
      ? { text: t(locale, "streamSepolia.me.won"), tone: "tw-text-emerald-400" }
      : { text: t(locale, "streamSepolia.me.wonUnsettled"), tone: "tw-text-emerald-400" };
  }
  return { text: t(locale, "streamSepolia.me.lost"), tone: "tw-text-iron-500" };
}

function workStatus(sale: SaleSummary, locale: SupportedLocale): string {
  if (sale.state !== AUCTION_STATE.SETTLED) return t(locale, "streamSepolia.me.onSale");
  // Sold means a buyer: an unsold sale can keep a withdrawn bid as its reserve.
  return !isZeroAddress(sale.bidder)
    ? t(locale, "streamSepolia.card.sold", { amount: formatEth(sale.bid, locale) })
    : t(locale, "streamSepolia.card.unsold");
}

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className={CARD} aria-label={title}>
      <h2 className={LABEL}>{title}</h2>
      <ul className="tw-m-0 tw-mt-2 tw-list-none tw-p-0">{children}</ul>
    </section>
  );
}

function ActivityBody({ viewer }: { readonly viewer: Address }) {
  const locale = useBrowserLocale();
  const now = useNow();
  const activity = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, "activity", viewer.toLowerCase()],
    queryFn: () => readMyActivity(viewer),
    refetchInterval: 30_000,
  });
  if (activity.isLoading) {
    return <p className="tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.loading")}</p>;
  }
  if (!activity.data) {
    return <p role="alert" className="tw-text-sm tw-text-red">{t(locale, "streamSepolia.loadError")}</p>;
  }
  const { oneOfOneBids, editionBids, works, payouts } = activity.data;
  const empty = oneOfOneBids.length + editionBids.length + works.length === 0;
  const workLink = (token: Address, tokenId: bigint) => `${STREAM_BASE}/work/${token}/${tokenId.toString()}`;
  return (
    <div className="tw-flex tw-flex-col tw-gap-5">
      {empty ? <p className="tw-m-0 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.me.empty")}</p> : null}
      {oneOfOneBids.length > 0 ? (
        <Section title={t(locale, "streamSepolia.me.oneBids")}>
          {oneOfOneBids.map((bid) => {
            const state = bidState(bid, now, locale);
            return (
              <li key={bid.saleId.toString()} className={ROW}>
                <Link href={workLink(bid.token, bid.tokenId)} className={LINK}>
                  <WorkTitle token={bid.token} tokenId={bid.tokenId} />
                </Link>
                <span className="tw-tabular-nums tw-text-iron-300">
                  {t(locale, "streamSepolia.me.yourHighest", { amount: formatEth(bid.highest, locale) })}{" "}
                  <span className={`tw-font-semibold ${state.tone}`}>{state.text}</span>
                </span>
              </li>
            );
          })}
        </Section>
      ) : null}
      {editionBids.length > 0 ? (
        <Section title={t(locale, "streamSepolia.me.editionBids")}>
          {editionBids.map((bid) => (
            <li key={`${bid.master}-${bid.tokenId}-${bid.bidId}`} className={ROW}>
              <Link href={workLink(bid.master, bid.tokenId)} className={LINK}>
                <WorkTitle token={bid.master} tokenId={bid.tokenId} />
              </Link>
              <span className="tw-text-iron-300">
                {t(locale, "streamSepolia.me.editionBid", { count: formatCount(bid.quantity, locale) })}{" "}
                <span className="tw-font-semibold">
                  {bid.claimed ? t(locale, "streamSepolia.me.claimed") : t(locale, "streamSepolia.me.openOrClaim")}
                </span>
              </span>
            </li>
          ))}
        </Section>
      ) : null}
      {works.length > 0 ? (
        <Section title={t(locale, "streamSepolia.me.works")}>
          {works.map((sale) => (
            <li key={sale.saleId.toString()} className={ROW}>
              <Link href={workLink(sale.token, sale.tokenId)} className={LINK}>
                <WorkTitle token={sale.token} tokenId={sale.tokenId} />
              </Link>
              <span className="tw-tabular-nums tw-text-iron-300">
                {workStatus(sale, locale)}
              </span>
            </li>
          ))}
        </Section>
      ) : null}
      {payouts.map((payout) => (
        <section key={payout.vault} className={CARD} aria-label={t(locale, "streamSepolia.me.payouts")}>
          <h2 className={LABEL}>{t(locale, "streamSepolia.me.payouts")}</h2>
          <p className="tw-m-0 tw-mt-2 tw-text-3xl tw-font-semibold tw-tabular-nums tw-text-iron-50">
            {formatEth(payout.releasable, locale)} ETH
          </p>
          <p className="tw-m-0 tw-mb-3 tw-mt-1 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.me.payoutsHelp")}</p>
          <TxAction
            label={t(locale, "streamSepolia.me.release")}
            doneText={t(locale, "streamSepolia.refund.done", { amount: formatEth(payout.releasable, locale) })}
            disabled={payout.releasable === 0n}
            request={() => ({
              address: getStreamInstance().addresses.splitLedger,
              abi: splitLedgerAbi as Abi,
              functionName: "release",
              args: [soloPayees(viewer), ZERO_HASH, CURRENCY_ETH, 0n],
            })}
          />
        </section>
      ))}
    </div>
  );
}

export function MyActivity() {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  return (
    <div className="tw-max-w-3xl">
      <h1 className="tw-m-0 tw-mb-6 tw-text-3xl tw-font-semibold tw-text-iron-50">{t(locale, "streamSepolia.me.title")}</h1>
      <WalletGate reason={t(locale, "streamSepolia.me.connect")}>
        {wallet.address ? <ActivityBody viewer={wallet.address} /> : null}
      </WalletGate>
    </div>
  );
}
