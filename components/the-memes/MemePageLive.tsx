"use client";

import dynamic from "next/dynamic";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { parseNftDescriptionToHtml } from "@/helpers/Helpers";
import {
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  MemeArtworkDetails,
  MemeCardFileType,
  MemeNftLivePanel,
} from "./MemePageLiveStats";

const MemePageArt = dynamic(() =>
  import("./MemePageArt").then((mod) => mod.MemePageArt)
);

export function MemePageLiveRightMenu(props: {
  show: boolean;
  nft: NFT | undefined;
}) {
  if (props.show && props.nft) {
    return (
      <div className="tw-w-full tw-pt-8">
        <MemeArtworkDetails nft={props.nft} />
        <MemeNftLivePanel nft={props.nft} />
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
            key={
              props.defaultAdditionalDetailsOpen
                ? "additional-details-open"
                : "additional-details-closed"
            }
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
    <section className="tw-max-w-4xl tw-text-pretty tw-pb-3">
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
    <section className="tw-mt-4 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="tw-group tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-bg-transparent tw-px-0 tw-py-4 tw-text-left tw-text-iron-100 tw-transition-colors tw-duration-300 tw-ease-out hover:tw-text-white"
      >
        <span className="tw-flex tw-items-center tw-gap-3">
          <span
            className={`tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-p-1.5 tw-transition-colors tw-duration-300 tw-ease-out ${
              isOpen
                ? "tw-bg-primary-500 tw-text-iron-100"
                : "tw-bg-iron-900 tw-text-iron-500 group-hover:tw-text-iron-100"
            }`}
          >
            <InformationCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          </span>
          <span className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-200">
            Additional details
          </span>
        </span>
        <ChevronDownIcon
          className={`tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-500 tw-transition tw-duration-200 group-hover:tw-text-iron-100 ${
            isOpen ? "tw-rotate-180 tw-text-iron-100" : ""
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
