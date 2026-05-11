"use client";

import dynamic from "next/dynamic";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { parseNftDescriptionToHtml } from "@/helpers/Helpers";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
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
    <section className="tw-pb-3 tw-pt-4">
      <h3 className="tw-mb-2 tw-text-lg tw-font-bold tw-leading-6 tw-text-white">
        Card Description
      </h3>
      <div
        className="tw-text-base tw-leading-relaxed tw-text-white"
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
        className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-border-y tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-0 tw-py-4 tw-text-left tw-text-white tw-transition-colors hover:tw-text-white"
      >
        <span className="tw-text-lg tw-font-semibold">Additional Details</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="tw-pt-3">
          <MemePageArt show={true} nft={nft} nftMeta={nftMeta} />
        </div>
      )}
    </section>
  );
}
