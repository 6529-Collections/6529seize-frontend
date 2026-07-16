"use client";

import dynamic from "next/dynamic";
import type { NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { parseNftDescriptionToHtml } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
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
}) {
  if (props.show && props.nft) {
    const locale = props.locale ?? DEFAULT_LOCALE;

    return (
      <div className="tw-w-full">
        <MemeArtworkDetails nft={props.nft} locale={locale} />
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
}) {
  if (props.show) {
    const locale = props.locale ?? DEFAULT_LOCALE;

    return (
      <>
        {props.nft && (
          <>
            <MemePageCardDescription nft={props.nft} />
            <MemeCardFileType nft={props.nft} />
          </>
        )}
        {props.nft && props.nftMeta && (
          <MemePageAdditionalDetailsAccordion
            key={
              props.defaultAdditionalDetailsOpen
                ? "additional-details-open"
                : "additional-details-closed"
            }
            nft={props.nft}
            nftMeta={props.nftMeta}
            defaultOpen={props.defaultAdditionalDetailsOpen ?? false}
            locale={locale}
          />
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

  return (
    <section className="tw-mt-4 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setToggledOpen((current) => !(current ?? defaultOpen))}
        className="tw-group tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-bg-transparent tw-px-0 tw-py-4 tw-text-left tw-text-iron-100 tw-transition-colors tw-duration-150 tw-ease-out hover:tw-text-white motion-reduce:tw-transition-none"
      >
        <span className="tw-flex tw-items-center tw-gap-3">
          <span
            className={`tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-p-1.5 tw-transition-colors tw-duration-150 tw-ease-out motion-reduce:tw-transition-none ${
              isOpen
                ? "tw-bg-primary-500 tw-text-iron-100"
                : "tw-bg-iron-900 tw-text-iron-500 group-hover:tw-text-iron-100"
            }`}
          >
            <InformationCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          </span>
          <span className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-200">
            {t(locale, "theMemes.detail.live.additionalDetails")}
          </span>
        </span>
        <ChevronDownIcon
          className={`tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-500 tw-transition-transform tw-duration-200 tw-ease-out group-hover:tw-text-iron-100 motion-reduce:tw-transition-none ${
            isOpen ? "tw-rotate-180 tw-text-iron-100" : ""
          }`}
        />
      </button>
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
    </section>
  );
}
