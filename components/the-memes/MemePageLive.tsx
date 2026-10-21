"use client";

import type { NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import CollectDetailActions from "@/components/collect/CollectDetailActions";
import { parseNftDescriptionToHtml } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useCallback, useId, useState } from "react";
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
        <MemeArtworkDetails nft={props.nft} locale={locale} compactMobile />
        <div className="tw-py-3">
          <CollectDetailActions
            mobileSticky
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
            <MemePageCardDescription
              key={nft.id}
              nft={nft}
              locale={props.locale ?? DEFAULT_LOCALE}
            />
            <MemeCardFileType nft={nft} />
          </>
        )}
      </>
    );
  }

  return <></>;
}

function MemePageCardDescription({
  nft,
  locale,
}: {
  readonly nft: NFT;
  readonly locale: SupportedLocale;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const id = useId();
  const observeContent = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const measure = () => {
      // Use the full height even while expanded so the toggle remains available.
      const lineHeight = Number.parseFloat(
        getComputedStyle(element).lineHeight
      );
      setHasOverflow(element.scrollHeight > lineHeight * 5 + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="tw-max-w-4xl tw-text-pretty tw-pb-3">
      <div
        ref={observeContent}
        id={id}
        onFocusCapture={() => setExpanded(true)}
        className={`tw-text-base tw-font-normal tw-text-iron-300 ${expanded ? "" : "tw-line-clamp-5 sm:tw-line-clamp-none"}`}
        dangerouslySetInnerHTML={{
          __html: parseNftDescriptionToHtml(nft.description),
        }}
      />
      {hasOverflow && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
          className="tw-min-h-11 tw-border-0 tw-bg-transparent tw-px-0 tw-text-sm tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-hidden"
        >
          {t(
            locale,
            expanded
              ? "theMemes.detail.mobile.showLess"
              : "theMemes.detail.mobile.readMore"
          )}
        </button>
      )}
    </section>
  );
}
