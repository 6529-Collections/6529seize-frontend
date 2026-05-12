"use client";

import dynamic from "next/dynamic";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { parseNftDescriptionToHtml } from "@/helpers/Helpers";
import { faChevronDown, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import {
  MemeArtworkDetails,
  MemeCardFileType,
  MemeDistributionPlanLink,
  MemeNftLivePanel,
} from "./MemePageLiveStats";

const MemePageArt = dynamic(() =>
  import("./MemePageArt").then((mod) => mod.MemePageArt)
);

export function MemePageLiveRightMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftBalance: number;
}) {
  if (props.show && props.nft) {
    return (
      <div className="tw-w-full tw-pt-2">
        <MemeDistributionPlanLink nft={props.nft} />
        <MemeArtworkDetails nft={props.nft} />
        <MemeNftLivePanel nft={props.nft} nftBalance={props.nftBalance} />
      </div>
    );
  }

  return <></>;
}

export function MemePageLiveSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta?: MemesExtendedData | undefined;
  nftBalance?: number;
  defaultAdditionalDetailsOpen?: boolean;
}) {
  if (props.show) {
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
            nft={props.nft}
            nftMeta={props.nftMeta}
            defaultOpen={props.defaultAdditionalDetailsOpen ?? false}
          />
        )}
      </>
    );
  }

  return <></>;
}

function MemePageCardDescription({ nft }: { readonly nft: NFT }) {
  return (
    <section className="tw-max-w-4xl tw-text-pretty tw-pb-3 tw-pt-6">
      <div
        className="tw-text-base tw-font-normal tw-text-iron-400"
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
}: {
  readonly nft: NFT;
  readonly nftMeta: MemesExtendedData;
  readonly defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="tw-pt-6">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-bg-transparent tw-px-0 tw-py-4 tw-text-left tw-text-iron-100 tw-transition-colors hover:tw-text-white"
      >
        <span className="tw-flex tw-items-center tw-gap-4">
          <span
            className={`tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-transition-colors ${
              isOpen
                ? "tw-bg-primary-500 tw-text-white"
                : "tw-bg-iron-900 tw-text-iron-400"
            }`}
          >
            <FontAwesomeIcon icon={faInfoCircle} className="tw-h-5 tw-w-5" />
          </span>
          <span className="tw-text-lg tw-font-semibold">
            Additional details
          </span>
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div>
          <MemePageArt show={true} nft={nft} nftMeta={nftMeta} />
        </div>
      )}
    </section>
  );
}
