"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address, Hex } from "viem";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { workFactsAbi } from "@/lib/stream/abis";
import { getStreamClient } from "@/lib/stream/client";
import { getStreamInstance } from "@/lib/stream/instances";
import { readStartItem } from "@/lib/stream/reads";
import { streamTx } from "@/lib/stream/streamTx";

import { CARD } from "./OneOfOnePanel";
import { TxAction } from "./TxAction";
import { WalletGate } from "./WalletGate";

/**
 * A work started from the shelf has no published record yet (a curated start
 * through SaleStarter opens it; EnglishAuction.start does not), so wallets and
 * these pages cannot show its title. Opening the record and marking its media
 * complete are open to anyone; this offers whichever is next.
 */
export function PublishRecord({
  token,
  tokenId,
  firstStartTx,
  curated,
}: {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
}) {
  const locale = useBrowserLocale();
  const facts = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, getStreamInstance().name, "facts", token.toLowerCase(), tokenId.toString()],
    queryFn: () =>
      getStreamClient().readContract({
        address: getStreamInstance().addresses.workFacts,
        abi: workFactsAbi,
        functionName: "factsOf",
        args: [token, tokenId],
      }),
  });
  if (!facts.data || !firstStartTx || (facts.data.opened && facts.data.onChainComplete)) return null;
  const opening = !facts.data.opened;
  return (
    <section className={CARD} aria-labelledby="stream-publish-record">
      <h2 id="stream-publish-record" className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {t(locale, "streamSepolia.record.title")}
      </h2>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-300">
        {t(locale, opening ? "streamSepolia.record.openHelp" : "streamSepolia.record.completeHelp")}
      </p>
      <div className="tw-mt-3">
        <WalletGate reason={t(locale, "streamSepolia.one.connectToAct")}>
          <TxAction
            variant="secondary"
            label={t(locale, opening ? "streamSepolia.record.open" : "streamSepolia.record.complete")}
            doneText={t(locale, opening ? "streamSepolia.record.openDone" : "streamSepolia.record.completeDone")}
            request={async () => {
              const address = getStreamInstance().addresses.workFacts;
              if (!opening) {
                return streamTx({ address, abi: workFactsAbi, functionName: "markOnChainComplete", args: [token, tokenId] });
              }
              const started = await readStartItem(firstStartTx, curated);
              if (!started || started.media.length === 0) return null;
              return streamTx({
                address,
                abi: workFactsAbi,
                functionName: "open",
                args: [token, tokenId, started.item, [...started.media]],
              });
            }}
          />
        </WalletGate>
      </div>
    </section>
  );
}
