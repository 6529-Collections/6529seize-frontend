"use client";

import type { NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import CollectDetailActions from "@/components/collect/CollectDetailActions";
import { parseNftDescriptionToHtml } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import {
  MemeArtworkDetails,
  MemeCardFileType,
  MemeEditionSizeStats,
  MemeNftLivePanel,
} from "./MemePageLiveStats";

export function MemePageLiveRightMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta?: ApiMemesExtendedData | undefined;
  locale?: SupportedLocale;
  onMarketChange?: (() => void) | undefined;
}) {
  if (props.show && props.nft) {
    const locale = props.locale ?? DEFAULT_LOCALE;

    return (
      <div className="tw-w-full">
        <MemeArtworkDetails nft={props.nft} locale={locale} />
        <div className="tw-py-3">
          <CollectDetailActions
            collection="memes"
            tokenId={String(props.nft.id)}
            title={props.nft.name}
            locale={locale}
            {...(props.onMarketChange
              ? { onMarketChange: props.onMarketChange }
              : {})}
          />
        </div>
        {props.nftMeta && (
          <MemeEditionSizeStats nftMeta={props.nftMeta} locale={locale} />
        )}
        <MemeNftLivePanel
          nft={props.nft}
          recordedInTdh={props.nftMeta?.recorded_in_tdh}
          locale={locale}
        />
      </div>
    );
  }

  return <></>;
}

export function MemePageLiveSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta?: ApiMemesExtendedData | undefined;
  nftBalance?: number;
  locale?: SupportedLocale;
  marketRefreshVersion?: number | undefined;
}) {
  if (props.show) {
    const nft = props.nft;

    return (
      <>
        {nft && (
          <>
            <MemePageCardDescription nft={nft} />
            <MemeCardFileType nft={nft} />
          </>
        )}
      </>
    );
  }

  return <></>;
}

function MemePageCardDescription({ nft }: { readonly nft: NFT }) {
  return (
    <section className="tw-max-w-4xl tw-text-pretty tw-pb-3">
      <div
        className="tw-text-base tw-font-normal tw-text-iron-300"
        dangerouslySetInnerHTML={{
          __html: parseNftDescriptionToHtml(nft.description),
        }}
      />
    </section>
  );
}
