'use client';

import { useCallback } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import type { XtdhReceivedNft } from "@/types/xtdh";

import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { formatXtdhTotal, formatXtdhValue } from "../../utils";
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSelect();
      }
    },
    [handleSelect],
  );

  const grantorCount = getXtdhReceivedTokenGrantorCount(nft);
  const rateValue = formatXtdhValue(nft.xtdhRate);
  const totalReceived = formatXtdhTotal(nft.totalXtdhReceived);

  return (
    <div
      role="row"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${nft.tokenName}`}
      aria-expanded={isActive}
      aria-controls={detailsRegionId}
      className={clsx(
        "tw-grid tw-w-full tw-cursor-pointer tw-items-center tw-gap-3 tw-border-b tw-border-iron-900/60 tw-px-4 tw-py-2.5 tw-text-sm tw-leading-tight tw-transition-colors tw-duration-150 tw-ease-out last:tw-border-none",
        "focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950",
        XTDH_RECEIVED_TOKEN_TABLE_COLUMNS,
        isActive
          ? "tw-bg-primary-500/10 tw-ring-1 tw-ring-inset tw-ring-primary-500/60"
          : "hover:tw-bg-iron-900/55",
      )}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
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
            <span className="tw-text-xxs tw-uppercase tw-tracking-wide tw-text-iron-500">
              Token #{nft.tokenId}
            </span>
          </div>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2 md:tw-hidden">
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-xxs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
              Rate (/day)
            </span>
            <span className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-tabular-nums">
              {rateValue}
              <span className="tw-ml-1 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                /day
              </span>
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-xxs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
              Total Received
            </span>
            <span className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-tabular-nums">
              {totalReceived}
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-xxs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
              Grantors
            </span>
            <CustomTooltip content="View grantors" placement="top">
              <span>
                <XtdhReceivedGranterAvatarGroup
                  granters={nft.granters}
                  totalCount={grantorCount}
                />
              </span>
            </CustomTooltip>
          </div>
        </div>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-justify-end">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-tabular-nums">
          {rateValue}
          <span className="tw-ml-1 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
            /day
          </span>
        </span>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-justify-end">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-tabular-nums">
          {totalReceived}
        </span>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-w-full md:tw-items-center md:tw-justify-end">
        <CustomTooltip content="View grantors" placement="top">
          <span>
            <XtdhReceivedGranterAvatarGroup
              granters={nft.granters}
              totalCount={grantorCount}
            />
          </span>
        </CustomTooltip>
      </div>
    </div>
  );
}
