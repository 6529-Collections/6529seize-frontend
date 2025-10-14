'use client';

import clsx from "clsx";

import type { XtdhReceivedNft } from "@/types/xtdh";

import { XTDH_RECEIVED_TOKEN_TABLE_COLUMNS } from "../constants";
import { XtdhReceivedCollectionTokenRow } from "./XtdhReceivedCollectionTokenRow";

export interface XtdhReceivedCollectionTokensTableProps {
  readonly tokens: readonly XtdhReceivedNft[];
  readonly activeTokenId: string | null;
  readonly detailsRegionId: string;
  readonly onSelectToken: (tokenId: string) => void;
}

export function XtdhReceivedCollectionTokensTable({
  tokens,
  activeTokenId,
  detailsRegionId,
  onSelectToken,
}: XtdhReceivedCollectionTokensTableProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-uppercase tw-text-iron-400">
        <span className="tw-font-semibold">Tokens</span>
        <span className="tw-hidden md:tw-inline">Sort: Rate / Received / Grantors</span>
      </div>
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-850 tw-bg-iron-975/40">
        <div className="tw-max-h-[420px] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700">
          <div
            role="row"
            className={clsx(
              "tw-sticky tw-top-0 tw-z-10 tw-grid tw-items-center tw-gap-3 tw-bg-iron-950 tw-px-4 tw-py-3",
              XTDH_RECEIVED_TOKEN_TABLE_COLUMNS,
            )}
          >
            <span className="tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400">
              Token
            </span>
            <span className="tw-hidden md:tw-block tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400">
              Rate (/day)
            </span>
            <span className="tw-hidden md:tw-block tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400">
              Total Received
            </span>
            <span className="tw-hidden md:tw-block tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400">
              Grantors
            </span>
            <span className="tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400 tw-text-right">
              Action
            </span>
          </div>
          <div role="rowgroup">
            {tokens.map((token) => (
              <XtdhReceivedCollectionTokenRow
                key={token.tokenId}
                nft={token}
                isActive={token.tokenId === activeTokenId}
                onSelect={onSelectToken}
                detailsRegionId={detailsRegionId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
