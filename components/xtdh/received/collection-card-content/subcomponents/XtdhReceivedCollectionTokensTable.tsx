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
import { XtdhReceivedTokenRow } from "../../subcomponents/XtdhReceivedTokenRow";
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
}: XtdhReceivedCollectionTokensTableProps) {
  const headerBackground =
    tone === "overlay" ? "tw-bg-iron-950" : "tw-bg-iron-975/30";
  const containerPadding =
    tone === "overlay" ? "tw-px-2 tw-pt-3 tw-pb-4" : "tw-pl-5 tw-pr-4 tw-py-4";
  const focusRingOffsetClass =
    tone === "overlay"
      ? "focus-visible:tw-ring-offset-iron-950"
      : "focus-visible:tw-ring-offset-iron-975";

  const headerButtonClass =
    "tw-relative tw-inline-flex tw-w-full tw-items-center tw-justify-end tw-rounded-sm tw-border-none tw-bg-transparent tw-p-0 tw-pr-4 tw-text-xs tw-font-medium tw-text-iron-300 tw-leading-none";
  const headerButtonInteractiveClass =
    "tw-transition tw-duration-150 tw-ease-out hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400/70 focus-visible:tw-ring-offset-2";
  const activeSortClass = "tw-text-iron-100";
  const headerTextClass = "tw-text-xs tw-font-medium tw-leading-none";

  const getSortState = (key: XtdhReceivedTokenSortKey) =>
    sortKey === key ? sortDirection : "none";

  const renderSortIcon = (key: XtdhReceivedTokenSortKey) => {
    if (sortKey !== key) {
      return null;
    }

    const icon = sortDirection === "asc" ? faChevronUp : faChevronDown;
    return (
      <span
        className={clsx(
          "tw-absolute tw-right-0 tw-flex tw-h-3 tw-w-3 tw-items-center tw-justify-center tw-text-iron-300",
        )}
        aria-hidden="true"
      >
        <FontAwesomeIcon
          icon={icon}
          className="tw-h-3 tw-w-3"
        />
      </span>
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
            </div>
            <div
              role="row"
              className={clsx(
                "tw-grid tw-w-full tw-items-center tw-gap-3 tw-px-4 tw-pb-2 tw-text-xs tw-font-medium tw-text-iron-300",
                XTDH_RECEIVED_TOKEN_TABLE_COLUMNS,
              )}
            >
              <span
                role="columnheader"
                aria-sort="none"
                className={headerTextClass}
              >
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
                className="tw-hidden md:tw-flex md:tw-w-full md:tw-justify-end"
              >
                <button
                  type="button"
                  onClick={() => onRequestSort("rate")}
                  className={clsx(
                    headerButtonClass,
                    headerButtonInteractiveClass,
                    focusRingOffsetClass,
                    sortKey === "rate" && activeSortClass,
                  )}
                >
                  <span
                    className={clsx(
                      headerTextClass,
                      "tw-w-full tw-text-right",
                    )}
                  >
                    Rate (/day)
                  </span>
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
                className="tw-hidden md:tw-flex md:tw-w-full md:tw-justify-end"
              >
                <button
                  type="button"
                  onClick={() => onRequestSort("received")}
                  className={clsx(
                    headerButtonClass,
                    headerButtonInteractiveClass,
                    focusRingOffsetClass,
                    sortKey === "received" && activeSortClass,
                  )}
                >
                  <span
                    className={clsx(
                      headerTextClass,
                      "tw-w-full tw-text-right",
                    )}
                  >
                    Total Received
                  </span>
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
                className="tw-hidden md:tw-flex md:tw-w-full md:tw-justify-end"
              >
                <button
                  type="button"
                  onClick={() => onRequestSort("grantors")}
                  className={clsx(
                    headerButtonClass,
                    headerButtonInteractiveClass,
                    focusRingOffsetClass,
                    sortKey === "grantors" && activeSortClass,
                  )}
                >
                  <span
                    className={clsx(
                      headerTextClass,
                      "tw-w-full tw-text-right",
                    )}
                  >
                    Grantors
                  </span>
                  {renderSortIcon("grantors")}
                </button>
              </div>
            </div>
          </div>

          <div role="rowgroup">
            {tokens.length > 0 ? (
              tokens.map((token) => (
                <XtdhReceivedTokenRow
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
