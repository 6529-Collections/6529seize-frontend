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
import { isRevert } from "@/lib/stream/curatedCreate";
import { readStartItem } from "@/lib/stream/reads";
import { streamTx } from "@/lib/stream/streamTx";

import { CARD } from "./OneOfOnePanel";
import { TxAction } from "./TxAction";
import { WalletGate } from "./WalletGate";

type PublishStep = "open" | "complete";

/** A contract refusal means "not possible now"; an RPC failure is thrown so the read is retried. */
function refusedOrThrow(error: unknown): false {
  if (isRevert(error)) return false;
  throw error;
}

/**
 * The next publish step the contract would accept now, or null. Media that was
 * only registered (served off chain) can never be marked complete, so each
 * step is simulated before it is offered.
 */
async function nextPublishStep(
  token: Address,
  tokenId: bigint,
  firstStartTx: Hex | null,
  curated: boolean
): Promise<PublishStep | null> {
  const client = getStreamClient();
  const address = getStreamInstance().addresses.workFacts;
  const facts = await client.readContract({ address, abi: workFactsAbi, functionName: "factsOf", args: [token, tokenId] });
  if (!facts.opened) {
    if (!firstStartTx) return null;
    const started = await readStartItem(firstStartTx, curated);
    if (!started || started.media.length === 0) return null;
    const ok = await client
      .simulateContract({ address, abi: workFactsAbi, functionName: "open", args: [token, tokenId, started.item, [...started.media]] })
      .then(() => true)
      .catch(refusedOrThrow);
    return ok ? "open" : null;
  }
  if (facts.onChainComplete) return null;
  const ok = await client
    .simulateContract({ address, abi: workFactsAbi, functionName: "markOnChainComplete", args: [token, tokenId] })
    .then(() => true)
    .catch(refusedOrThrow);
  return ok ? "complete" : null;
}

/**
 * A work started from the shelf has no published record yet (a curated start
 * through SaleStarter opens it; EnglishAuction.start does not), so wallets and
 * these pages cannot show its title. Only an Independent start can be opened
 * here: its calldata carries the media list, a curated EnglishAuction start's
 * does not, so this shows nothing for that case. Opening the record and marking its media
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
  const next = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, getStreamInstance().name, "publishNext", token.toLowerCase(), tokenId.toString()],
    queryFn: () => nextPublishStep(token, tokenId, firstStartTx, curated),
    enabled: !!firstStartTx,
  });
  if (!next.data) return null;
  const opening = next.data === "open";
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
              const started = firstStartTx ? await readStartItem(firstStartTx, curated) : null;
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
