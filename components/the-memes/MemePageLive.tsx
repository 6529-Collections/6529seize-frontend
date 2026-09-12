"use client";

import dynamic from "next/dynamic";
import type { NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import MarketDepthPanel from "@/components/nft-market-depth/MarketDepthPanel";
import CollectDetailActions from "@/components/collect/CollectDetailActions";
import { MEMES_CONTRACT } from "@/constants/constants";
import { parseNftDescriptionToHtml } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useId, useState } from "react";
import {
  MemeArtworkDetails,
  MemeCardFileType,
  MemeEditionSizeStats,
  MemeNftLivePanel,
} from "./MemePageLiveStats";

const MemePageArt = dynamic(() =>
  import("./MemePageArt").then((mod) => mod.MemePageArt)
);

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
  defaultAdditionalDetailsOpen?: boolean;
  locale?: SupportedLocale;
  marketRefreshVersion?: number | undefined;
}) {
  if (props.show) {
    const locale = props.locale ?? DEFAULT_LOCALE;
    const nft = props.nft;

    return (
      <>
        {nft && (
          <>
            <MemePageCardDescription nft={nft} />
            <MemeCardFileType nft={nft} />
            {props.nftMeta && (
              <MemePageAdditionalDetailsAccordion
                key={
                  props.defaultAdditionalDetailsOpen
                    ? "additional-details-open"
                    : "additional-details-closed"
                }
                nft={nft}
                nftMeta={props.nftMeta}
                defaultOpen={props.defaultAdditionalDetailsOpen ?? false}
                locale={locale}
              />
            )}
            <MarketDepthPanel
              contract={MEMES_CONTRACT}
              tokenId={nft.id}
              locale={locale}
              refreshKey={props.marketRefreshVersion ?? 0}
            />
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

function MemePageAdditionalDetailsAccordion({
  nft,
  nftMeta,
  defaultOpen,
  locale,
}: {
  readonly nft: NFT;
  readonly nftMeta: ApiMemesExtendedData;
  readonly defaultOpen: boolean;
  readonly locale: SupportedLocale;
}) {
  const [toggledOpen, setToggledOpen] = useState<boolean | null>(null);
  const isOpen = toggledOpen ?? defaultOpen;
  const panelId = useId();

  return (
    <section className="tw-mt-4 tw-border-0 tw-border-y tw-border-solid tw-border-white/10">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={t(locale, "theMemes.detail.live.additionalDetails")}
        aria-describedby={`${panelId}-description`}
        onClick={(event) => {
          // Keep the heading as the scroll anchor, including on touch browsers.
          event.currentTarget.focus({ preventScroll: true });
          setToggledOpen((current) => !(current ?? defaultOpen));
        }}
        className="tw-group tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-4 tw-text-left tw-text-iron-200 tw-transition-colors tw-duration-150 tw-ease-out hover:tw-bg-white/5 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
      >
        <span className="tw-min-w-0 tw-space-y-1">
          <span className="tw-block tw-text-base tw-font-medium tw-leading-6 tw-text-iron-200 group-hover:tw-text-white sm:tw-text-lg">
            {t(locale, "theMemes.detail.live.additionalDetails")}
          </span>
          <span
            id={`${panelId}-description`}
            className="tw-block tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400"
          >
            {t(locale, "theMemes.detail.live.additionalDetailsDescription")}
          </span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-5 tw-shrink-0 tw-text-iron-400 tw-transition-transform tw-duration-200 tw-ease-out group-hover:tw-text-white motion-reduce:tw-transition-none ${
            isOpen ? "tw-rotate-180 tw-text-iron-100" : ""
          }`}
        />
      </button>
      <div id={panelId} hidden={!isOpen} className="[overflow-anchor:none]">
        {isOpen && (
          <div className="tw-animate-fadeIn motion-reduce:tw-animate-none">
            <MemePageArt
              show={true}
              nft={nft}
              nftMeta={nftMeta}
              locale={locale}
            />
          </div>
        )}
      </div>
    </section>
  );
}
