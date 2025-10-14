'use client';

import { useState } from "react";
import clsx from "clsx";
import type { XtdhReceivedNft } from "@/types/xtdh";
import { formatXtdhRate, formatXtdhTotal } from "../utils";
import { XtdhReceivedGranterAvatarGroup } from "./XtdhReceivedGranterAvatarGroup";
import { XtdhReceivedGranterRow } from "./XtdhReceivedGranterRow";

export interface XtdhReceivedNftCardProps {
  readonly nft: XtdhReceivedNft;
  readonly showCollectionName?: boolean;
}

export function XtdhReceivedNftCard({
  nft,
  showCollectionName = true,
}: XtdhReceivedNftCardProps) {
  const [expanded, setExpanded] = useState(false);
  const grantorPanelId = `nft-grantors-${nft.tokenId}`;
  const containerClass = clsx(
    "tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-flex tw-flex-col tw-gap-4",
    showCollectionName ? "tw-rounded-2xl" : "tw-rounded-xl tw-bg-iron-900"
  );
  const imageClass = clsx(
    "tw-object-cover tw-border tw-border-iron-700",
    showCollectionName
      ? "tw-h-16 tw-w-16 tw-rounded-xl"
      : "tw-h-12 tw-w-12 tw-rounded-lg"
  );
  const expandedContentClass = clsx(
    "tw-space-y-2",
    showCollectionName ? undefined : "tw-mt-4"
  );

  return (
    <div className={containerClass} role="listitem">
      <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <img
            src={nft.tokenImage}
            alt={`${nft.tokenName} artwork`}
            className={imageClass}
            loading="lazy"
          />
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {nft.tokenName}
            </span>
            {showCollectionName && (
              <span className="tw-text-xs tw-text-iron-300">
                {nft.collectionName}
              </span>
            )}
            <span className="tw-text-xs tw-text-iron-300">
              {formatXtdhRate(nft.xtdhRate)}
            </span>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 md:tw-flex-row md:tw-justify-end">
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
              Total Received
            </span>
            <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
              {formatXtdhTotal(nft.totalXtdhReceived)}
            </span>
          </div>
          <XtdhReceivedGranterAvatarGroup
            granters={nft.granters}
            showCountLabel={true}
          />
          <button
            type="button"
            onClick={() => {
              setExpanded((prev) => !prev);
            }}
            aria-expanded={expanded}
            aria-controls={grantorPanelId}
            className="md:tw-ml-auto tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-850 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
          >
            {expanded ? "Hide grantors" : "View grantors"}
          </button>
        </div>
      </div>
      {expanded && (
        <div
          id={grantorPanelId}
          className={expandedContentClass}
          role="region"
          aria-label={`Grantors for ${nft.tokenName}`}
        >
          {nft.granters.map((granter) => (
            <XtdhReceivedGranterRow
              key={`${nft.tokenId}-${granter.profileId}`}
              granter={granter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
