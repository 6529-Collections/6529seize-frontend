"use client";

import { englishAuctionAbi } from "@/lib/stream/abis";

import { THE_MEMES_GRID_CLASS_NAME } from "@/components/the-memes/theMemesLayout";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { getStreamInstance } from "@/lib/stream/instances";
import type { PendingStart } from "@/lib/stream/startFile";

import { streamTx } from "@/lib/stream/streamTx";

import { TxAction } from "./TxAction";
import { usePendingStarts, useStartPreview } from "./useStreamData";
import { WalletGate } from "./WalletGate";

const LABEL =
  "tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500";

function StartCard({ start }: { readonly start: PendingStart }) {
  const locale = useBrowserLocale();
  const preview = useStartPreview(start);
  const title = preview.data?.title ?? t(locale, "streamSepolia.start.untitled");
  return (
    <li className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-950">
        {preview.data?.image ? (
          // Art is a data URL read from the chain; next/image cannot optimise it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.data.image} alt={title} className="tw-h-full tw-w-full tw-object-contain" />
        ) : (
          <span aria-hidden="true" className="tw-p-6 tw-text-center tw-text-sm tw-font-semibold tw-text-iron-600">{title}</span>
        )}
      </div>
      <div>
        <p className="tw-m-0 tw-truncate tw-text-base tw-font-semibold tw-text-iron-50">{title}</p>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.start.status")}</p>
      </div>
      <WalletGate>
        <TxAction
          fullWidth
          label={t(locale, "streamSepolia.start.button")}
          description={t(locale, "streamSepolia.start.help")}
          doneText={t(locale, "streamSepolia.start.done")}
          request={() => (streamTx({
            address: getStreamInstance().addresses.englishAuction,
            abi: englishAuctionAbi,
            functionName: "start",
            args: [start.token, start.request],
          }))}
        />
      </WalletGate>
    </li>
  );
}

/** Approved works nobody has started yet. Anyone may start a sale. */
export function ReadyToStart() {
  const locale = useBrowserLocale();
  const pending = usePendingStarts();
  if (!pending.data || pending.data.length === 0) return null;
  return (
    <section className="tw-mt-6" aria-labelledby="stream-ready-to-start">
      <h3 id="stream-ready-to-start" className={LABEL}>
        {t(locale, "streamSepolia.start.title")}
      </h3>
      <ul className={`tw-m-0 tw-mt-3 tw-list-none tw-p-0 ${THE_MEMES_GRID_CLASS_NAME}`}>
        {pending.data.map((start) => (
          <StartCard key={start.itemHash} start={start} />
        ))}
      </ul>
    </section>
  );
}
