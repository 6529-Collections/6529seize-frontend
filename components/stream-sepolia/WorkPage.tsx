"use client";

import { isAddress, type Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { getStreamInstance } from "@/lib/stream/instances";
import { ITEM_KIND } from "@/lib/stream/item";
import { artistAddress } from "@/lib/stream/reads";
import { AUCTION_STATE, sameAddress } from "@/lib/stream/state";

import { EditionPanel, OpenEdition } from "./EditionPanel";
import { StreamIdentity } from "./StreamIdentity";
import { OneOfOnePanel } from "./OneOfOnePanel";
import { useEdition, useOneOfOne, useWorkMeta } from "./useStreamData";
import { WorkArt } from "./WorkArt";
import { StreamLoading } from "./StreamLoading";

const LABEL =
  "tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500";

export function WorkPage({ token, tokenId }: { readonly token: string; readonly tokenId: string }) {
  const locale = useBrowserLocale();
  if (!isAddress(token) || !/^\d{1,78}$/.test(tokenId)) {
    return <p className="tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.work.notFound")}</p>;
  }
  return <WorkBody token={token} tokenId={BigInt(tokenId)} />;
}

function WorkBody({ token, tokenId }: { readonly token: Address; readonly tokenId: bigint }) {
  const locale = useBrowserLocale();
  const curated = sameAddress(token, getStreamInstance().addresses.stream);
  const meta = useWorkMeta(token, tokenId);
  const oneOfOne = useOneOfOne(token, tokenId);
  const isMaster = meta.data?.kind === ITEM_KIND.EDITION_MASTER;
  const edition = useEdition(token, tokenId);

  if (meta.isLoading || oneOfOne.isLoading) {
    return (
      <StreamLoading
        onRetry={() => {
          void meta.refetch();
          void oneOfOne.refetch();
        }}
      />
    );
  }
  // A failed refresh keeps showing the last good data.
  if (!meta.data || !oneOfOne.data) {
    return (
      <p role="alert" className="tw-text-sm tw-text-red">
        {t(locale, "streamSepolia.work.notFound")}
      </p>
    );
  }
  const title =
    meta.data.name ?? t(locale, "streamSepolia.work.untitled", { id: tokenId.toString() });
  const artist = artistAddress(meta.data.artistId);
  const productLabel = curated
    ? t(locale, "streamSepolia.product.stream")
    : t(locale, "streamSepolia.product.independent");
  const editionLabel = curated
    ? t(locale, "streamSepolia.product.streamEditions")
    : t(locale, "streamSepolia.product.independentEditions");
  const masterOpen = oneOfOne.data.auction.state === AUCTION_STATE.ACTIVE;
  // The edition sale is not open yet and can be: make it the next action.
  const openable = !!edition.data && edition.data.sale.status === 0 && isMaster && masterOpen;
  const showEditions =
    edition.data && (edition.data.sale.status !== 0 || (isMaster && masterOpen));

  return (
    <div>
      <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:tw-gap-10">
        <WorkArt
          token={token}
          tokenId={tokenId}
          firstStartTx={oneOfOne.data.firstStartTx}
          curated={curated}
          title={title}
          size="large"
        />
        <div className="tw-flex tw-flex-col tw-gap-5">
          <div>
            <p className={LABEL}>
              {t(locale, "streamSepolia.work.eyebrow", { product: productLabel, id: tokenId.toString() })}
            </p>
            <h1 className="tw-m-0 tw-mt-1 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl">
              {title}
            </h1>
            <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
              {t(locale, "streamSepolia.work.by")}{" "}
              <StreamIdentity address={artist} />
            </p>
            {meta.data.description ? (
              <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">{meta.data.description}</p>
            ) : null}
          </div>
          {openable && edition.data ? (
            <OpenEdition
              detail={edition.data}
              tokenId={tokenId}
              firstStartTx={oneOfOne.data.firstStartTx}
              curated={curated}
            />
          ) : null}
          <OneOfOnePanel detail={oneOfOne.data} independent={!curated} owner={meta.data.owner} />
        </div>
      </div>
      {showEditions && edition.data ? (
        <EditionPanel
          detail={edition.data}
          masterOpen={masterOpen}
          productLabel={editionLabel}
        />
      ) : null}
    </div>
  );
}
