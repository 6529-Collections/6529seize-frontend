'use client';

import { useMemo } from "react";
import type { XtdhReceivedNft } from "@/types/xtdh";
import { formatRate, formatTotal } from "../utils";
import { UserPageXtdhReceivedGranterAvatarGroup } from "./GranterAvatarGroup";
import { UserPageXtdhReceivedGranterRow } from "./GranterRow";

export interface UserPageXtdhReceivedNftCardProps {
  readonly nft: XtdhReceivedNft;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

export function UserPageXtdhReceivedNftCard({
  nft,
  expanded,
  onToggle,
}: UserPageXtdhReceivedNftCardProps) {
  const additionalGranters = useMemo(
    () => Math.max(nft.granterCount - nft.granterPreviews.length, 0),
    [nft]
  );
  const granterPanelId = `nft-granters-${nft.tokenId}`;

  return (
    <div
      className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-flex tw-flex-col tw-gap-4"
      role="listitem"
    >
      <div className="tw-flex tw-items-center tw-gap-3">
        <img
          src={nft.tokenImage}
          alt={`${nft.tokenName} artwork`}
          className="tw-h-16 tw-w-16 tw-rounded-xl tw-object-cover tw-border tw-border-iron-700"
          loading="lazy"
        />
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {nft.tokenName}
          </span>
          <span className="tw-text-xs tw-text-iron-300">
            {nft.collectionName}
          </span>
          <span className="tw-text-xs tw-text-iron-300">
            {formatRate(nft.xtdhRate)}
          </span>
        </div>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
            Total Received
          </span>
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
            {formatTotal(nft.totalXtdhReceived)}
          </span>
        </div>
        <UserPageXtdhReceivedGranterAvatarGroup
          granters={nft.granterPreviews}
          granterCount={nft.granterCount}
          additional={additionalGranters}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={granterPanelId}
          className="tw-ml-auto tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-850 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
        >
          {expanded ? "Hide granters" : "View granters"}
        </button>
      </div>
      {expanded && (
        <div
          id={granterPanelId}
          className="tw-space-y-2"
          role="region"
          aria-label={`Granters for ${nft.tokenName}`}
        >
          {nft.granters.map((granter) => (
            <UserPageXtdhReceivedGranterRow
              key={`${nft.tokenId}-${granter.profileId}`}
              granter={granter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
