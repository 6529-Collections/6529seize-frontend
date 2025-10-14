'use client';

import type { ReactNode } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

import type { XtdhReceivedNft } from "@/types/xtdh";

import { XTDH_RECEIVED_TOKEN_TABLE_COLUMNS } from "../constants";
import { XtdhReceivedCollectionTokenRow } from "./XtdhReceivedCollectionTokenRow";
import type {
  XtdhReceivedTokenSortDirection,
  XtdhReceivedTokenSortKey,
} from "../hooks/useXtdhReceivedTokenSorting";

export interface XtdhReceivedCollectionTokensTableProps {
  readonly tone?: "inline" | "overlay";
  readonly headerLabel: string;
  readonly headerCaption?: string;
  readonly emptyState?: ReactNode;
  readonly tokens: readonly XtdhReceivedNft[];
  readonly activeTokenId: string | null;
  readonly detailsRegionId: string;
  readonly onSelectToken: (tokenId: string) => void;
  readonly sortKey: XtdhReceivedTokenSortKey;
  readonly sortDirection: XtdhReceivedTokenSortDirection;
  readonly onRequestSort: (key: XtdhReceivedTokenSortKey) => void;
  readonly onCollapse?: () => void;
}

export function XtdhReceivedCollectionTokensTable({
  tone = "inline",
  headerLabel,
  headerCaption,
  emptyState,
  tokens,
  activeTokenId,
  detailsRegionId,
  onSelectToken,
  sortKey,
  sortDirection,
  onRequestSort,
  onCollapse,
}: XtdhReceivedCollectionTokensTableProps) {
  const headerBackground =
    tone === "overlay" ? "tw-bg-iron-950" : "tw-bg-iron-975/30";
  const containerPadding =
    tone === "overlay" ? "tw-px-2 tw-pt-3 tw-pb-4" : "tw-pl-5 tw-pr-4 tw-py-4";
  const collapseLabel = "Collapse tokens";

  const headerButtonClass =
    "tw-flex tw-items-center tw-gap-1 tw-text-xxs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400";
  const headerButtonInteractiveClass =
    "tw-rounded-sm tw-px-1 tw-py-0.5 tw-text-iron-300 tw-transition tw-duration-150 tw-ease-out hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-1 focus-visible:tw-ring-offset-transparent";
  const activeSortClass = "tw-text-primary-200";

  const getSortState = (key: XtdhReceivedTokenSortKey) =>
    sortKey === key ? sortDirection : "none";

  const renderSortIcon = (key: XtdhReceivedTokenSortKey) => {
    if (sortKey !== key) {
      return null;
    }

    const icon = sortDirection === "asc" ? faChevronUp : faChevronDown;
    return (
      <FontAwesomeIcon
        icon={icon}
        className="tw-h-3 tw-w-3 tw-text-primary-300"
      />
    );
  };

  return (
    <div className={clsx("tw-flex tw-w-full tw-flex-col", containerPadding)}>
      <div className="tw-relative tw-w-full tw-overflow-hidden tw-bg-iron-975/15">
        <div className="tw-max-h-[480px] tw-w-full tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-800">
          <div
            className={clsx(
              "tw-sticky tw-top-0 tw-z-10 tw-border-b tw-border-iron-900/60",
              headerBackground,
            )}
          >
            <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3">
              <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
                <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-300">
                  {headerLabel}
                </span>
                {headerCaption && (
                  <span className="tw-text-xxs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                    {headerCaption}
                  </span>
                )}
              </div>
              {onCollapse && (
                <button
                  type="button"
                  onClick={onCollapse}
                  className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-iron-800 tw-bg-iron-900/40 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-200 tw-transition tw-duration-150 tw-ease-out hover:tw-border-iron-700 hover:tw-bg-iron-900/60 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-transparent"
                  aria-label={collapseLabel}
                >
                  <span>Collapse</span>
                  <FontAwesomeIcon icon={faChevronUp} className="tw-h-3 tw-w-3" />
                </button>
              )}
            </div>
            <div
              role="row"
              className={clsx(
                "tw-grid tw-w-full tw-items-center tw-gap-3 tw-px-4 tw-pb-2 tw-text-xxs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400",
                XTDH_RECEIVED_TOKEN_TABLE_COLUMNS,
              )}
            >
              <span role="columnheader" aria-sort="none">
                Token
              </span>
              <div
                role="columnheader"
                aria-sort={
                  getSortState("rate") === "none"
                    ? "none"
                    : getSortState("rate") === "asc"
                      ? "ascending"
                      : "descending"
                }
                className="tw-hidden md:tw-flex md:tw-justify-end"
              >
                <button
                  type="button"
                  onClick={() => onRequestSort("rate")}
                  className={clsx(
                    headerButtonClass,
                    headerButtonInteractiveClass,
                    sortKey === "rate" && activeSortClass,
                  )}
                >
                  <span>Rate (/day)</span>
                  {renderSortIcon("rate")}
                </button>
              </div>
              <div
                role="columnheader"
                aria-sort={
                  getSortState("received") === "none"
                    ? "none"
                    : getSortState("received") === "asc"
                      ? "ascending"
                      : "descending"
                }
                className="tw-hidden md:tw-flex md:tw-justify-end"
              >
                <button
                  type="button"
                  onClick={() => onRequestSort("received")}
                  className={clsx(
                    headerButtonClass,
                    headerButtonInteractiveClass,
                    sortKey === "received" && activeSortClass,
                  )}
                >
                  <span>Total Received</span>
                  {renderSortIcon("received")}
                </button>
              </div>
              <div
                role="columnheader"
                aria-sort={
                  getSortState("grantors") === "none"
                    ? "none"
                    : getSortState("grantors") === "asc"
                      ? "ascending"
                      : "descending"
                }
                className="tw-hidden md:tw-flex md:tw-justify-start"
              >
                <button
                  type="button"
                  onClick={() => onRequestSort("grantors")}
                  className={clsx(
                    headerButtonClass,
                    headerButtonInteractiveClass,
                    sortKey === "grantors" && activeSortClass,
                  )}
                >
                  <span>Grantors</span>
                  {renderSortIcon("grantors")}
                </button>
              </div>
              <span
                role="columnheader"
                aria-sort="none"
                className="tw-flex tw-justify-end tw-text-right"
              >
                Action
              </span>
            </div>
          </div>

          <div role="rowgroup">
            {tokens.length > 0 ? (
              tokens.map((token) => (
                <XtdhReceivedCollectionTokenRow
                  key={token.tokenId}
                  nft={token}
                  isActive={token.tokenId === activeTokenId}
                  onSelect={onSelectToken}
                  detailsRegionId={detailsRegionId}
                />
              ))
            ) : (
              <div className="tw-flex tw-w-full tw-justify-center tw-px-4 tw-py-10">
                {emptyState ?? (
                  <span className="tw-text-sm tw-text-iron-400">
                    {`No tokens found.`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
