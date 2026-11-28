"use client";

import { editionAuctionAbi, englishAuctionAbi, independentEditionAuctionAbi } from "@/lib/stream/abis";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { getStreamInstance } from "@/lib/stream/instances";
import { CURRENCY_ETH } from "@/lib/stream/item";

import { formatEth } from "./format";
import { streamTx } from "@/lib/stream/streamTx";

import { TxAction } from "./TxAction";
import { useClaimable } from "./useStreamData";
import { useStreamWallet } from "./WalletGate";

/** ETH the connected wallet can take back now: outbid 1/1 bids and edition refunds. */
export function RefundBanner() {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const claimable = useClaimable(wallet.address);
  if (!wallet.address || !wallet.onSepolia || !claimable.data) return null;
  const viewer = wallet.address;
  const instance = getStreamInstance();
  const items = [
    {
      key: "english",
      amount: claimable.data.english,
      request: () => (streamTx({
        address: instance.addresses.englishAuction,
        abi: englishAuctionAbi,
        functionName: "claim",
        args: [viewer],
      })),
    },
    {
      key: "edition",
      amount: claimable.data.edition,
      request: () => (streamTx({
        address: instance.addresses.editionAuction,
        abi: editionAuctionAbi,
        functionName: "claim",
        args: [CURRENCY_ETH, viewer],
      })),
    },
    {
      key: "independentEdition",
      amount: claimable.data.independentEdition,
      request: () => (streamTx({
        address: instance.addresses.independentEditionAuction,
        abi: independentEditionAuctionAbi,
        functionName: "claim",
        args: [CURRENCY_ETH, viewer],
      })),
    },
  ].filter((item) => item.amount > 0n);
  if (items.length === 0) return null;
  return (
    <div
      role="status"
      className="tw-mb-6 tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-emerald-400/25 tw-bg-emerald-400/[0.06] tw-p-4"
    >
      {items.map((item) => (
        <div key={item.key} className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <p className="tw-m-0 tw-text-sm tw-text-iron-100">
            {t(locale, "streamSepolia.refund.available", { amount: formatEth(item.amount, locale) })}
          </p>
          <TxAction
            label={t(locale, "streamSepolia.refund.withdraw")}
            doneText={t(locale, "streamSepolia.refund.done", { amount: formatEth(item.amount, locale) })}
            request={item.request}
          />
        </div>
      ))}
    </div>
  );
}
