'use client';

import { useCallback } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

import type { XtdhReceivedNft } from "@/types/xtdh";

import { formatXtdhRate, formatXtdhTotal } from "../../utils";
import { XtdhReceivedGranterAvatarGroup } from "../../subcomponents/XtdhReceivedGranterAvatarGroup";
import { XTDH_RECEIVED_TOKEN_TABLE_COLUMNS } from "../constants";
import { getXtdhReceivedTokenGrantorCount } from "../utils/tokenGrantors";

export interface XtdhReceivedCollectionTokenRowProps {
  readonly nft: XtdhReceivedNft;
  readonly isActive: boolean;
  readonly detailsRegionId: string;
  readonly onSelect: (tokenId: string) => void;
}

export function XtdhReceivedCollectionTokenRow({
  nft,
  isActive,
  detailsRegionId,
  onSelect,
}: XtdhReceivedCollectionTokenRowProps) {
  const handleSelect = useCallback(() => {
    onSelect(nft.tokenId);
  }, [nft.tokenId, onSelect]);

  const grantorCount = getXtdhReceivedTokenGrantorCount(nft);

  return (
    <div
      role="row"
      className={clsx(
        "tw-grid tw-w-full tw-items-center tw-gap-3 tw-border-b tw-border-iron-900/60 tw-px-4 tw-py-3 tw-text-sm tw-leading-tight tw-transition tw-duration-150 tw-ease-out last:tw-border-none",
        XTDH_RECEIVED_TOKEN_TABLE_COLUMNS,
        isActive
          ? "tw-bg-primary-500/10 tw-ring-1 tw-ring-inset tw-ring-primary-500/60"
          : "hover:tw-bg-iron-900/60",
      )}
    >
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
        <img
          src={nft.tokenImage}
          alt={`${nft.tokenName} artwork`}
          className="tw-h-12 tw-w-12 tw-flex-shrink-0 tw-rounded-lg tw-border tw-border-iron-800 tw-object-cover"
          loading="lazy"
        />
        <div className="tw-flex tw-min-w-0 tw-flex-col">
          <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
            {nft.tokenName}
          </span>
          <span className="tw-text-xxs tw-uppercase tw-text-iron-400">
            Token #{nft.tokenId}
          </span>
        </div>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-justify-end">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {formatXtdhRate(nft.xtdhRate)}
        </span>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-justify-end">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {formatXtdhTotal(nft.totalXtdhReceived)}
        </span>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-justify-start">
        <XtdhReceivedGranterAvatarGroup
          granters={nft.granters}
          totalCount={grantorCount}
          onClick={handleSelect}
          ariaLabel={`View grantors for ${nft.tokenName}`}
        />
      </div>
      <div className="tw-flex tw-justify-end md:tw-justify-end">
        <button
          type="button"
          onClick={handleSelect}
          aria-expanded={isActive}
          aria-controls={detailsRegionId}
          className={clsx(
            "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-transparent tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300 tw-transition tw-duration-150 tw-ease-out",
            "hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950",
          )}
        >
          <span>Details</span>
          <FontAwesomeIcon icon={faChevronRight} className="tw-h-3 tw-w-3" />
        </button>
      </div>
    </div>
  );
}
