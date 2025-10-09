"use client";

import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { XtdhEcosystemToken, XtdhEcosystemTokensResponse } from "@/types/xtdh";
import XtdhFilterBar from "../filters/XtdhFilterBar";
import { TOKEN_SORT_OPTIONS } from "../filters/constants";
import type { XtdhTokensViewState } from "../filters/types";
export type { XtdhTokensViewState } from "../filters/types";

export const TOKENS_PAGE_SIZE = 25;

interface XtdhTokensViewProps {
  readonly state: XtdhTokensViewState;
  readonly connectedProfileId: string | null;
  readonly onSortChange: (sort: XtdhTokensViewState["sort"]) => void;
  readonly onDirectionToggle: () => void;
  readonly onNetworksChange: (networks: string[]) => void;
  readonly onMinRateChange: (value: number | undefined) => void;
  readonly onMinGrantorsChange: (value: number | undefined) => void;
  readonly onToggleMyGrants: (enabled: boolean) => void;
  readonly onToggleReceiving: (enabled: boolean) => void;
  readonly onPageChange: (page: number) => void;
  readonly query: UseQueryResult<XtdhEcosystemTokensResponse, Error>;
}

export default function XtdhTokensView({
  state,
  connectedProfileId,
  onSortChange,
  onDirectionToggle,
  onNetworksChange,
  onMinRateChange,
  onMinGrantorsChange,
  onToggleMyGrants,
  onToggleReceiving,
  onPageChange,
  query,
}: Readonly<XtdhTokensViewProps>) {
  const { data, isLoading, isError, error, isFetching, refetch } = query;

  const tokens = data?.tokens ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.max(1, Math.ceil(totalCount / TOKENS_PAGE_SIZE));
  }, [totalCount]);
  const haveNextPage = useMemo(
    () => state.page * TOKENS_PAGE_SIZE < totalCount,
    [state.page, totalCount]
  );

  const availableNetworks = data?.availableFilters.networks ?? [];
  const disableInteractions = isLoading || isFetching;

  const resultSummary = useMemo(() => {
    if (isError) {
      return "Failed to load tokens.";
    }
    if (isLoading) {
      return "Loading tokens…";
    }
    if (isFetching) {
      return "Updating tokens…";
    }
    const label = totalCount === 1 ? "token" : "tokens";
    return `Showing ${totalCount.toLocaleString()} ${label}`;
  }, [isError, isFetching, isLoading, totalCount]);

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "Unable to fetch tokens.";
    return (
      <div className="tw-rounded-2xl tw-border tw-border-rose-500/40 tw-bg-rose-900/20 tw-p-6 tw-space-y-4">
        <div>
          <h3 className="tw-text-base tw-font-semibold tw-text-rose-100 tw-m-0">
            Error loading tokens
          </h3>
          <p className="tw-text-sm tw-text-rose-200 tw-m-0">{errorMessage}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-0"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="tw-flex tw-flex-col tw-gap-4 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 lg:tw-p-6">
      <header className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
        <div className="tw-space-y-2">
          <h2 className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-m-0">
            Tokens Receiving xTDH
          </h2>
          <p className="tw-text-sm tw-text-iron-300 tw-m-0">
            Drill into individual NFTs to see current rate, grantors, and your participation.
          </p>
        </div>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="tw-text-sm tw-text-iron-300"
        >
          {resultSummary}
        </div>
      </header>

      <XtdhFilterBar
        view="tokens"
        state={state}
        sortOptions={TOKEN_SORT_OPTIONS}
        connectedProfileId={connectedProfileId}
        availableNetworks={availableNetworks}
        disableInteractions={disableInteractions}
        onSortChange={onSortChange}
        onDirectionToggle={onDirectionToggle}
        onNetworksChange={onNetworksChange}
        onMinRateChange={onMinRateChange}
        onMinGrantorsChange={onMinGrantorsChange}
        onToggleMyGrants={onToggleMyGrants}
        onToggleReceiving={onToggleReceiving}
      />

      <div className="tw-flex tw-flex-col tw-gap-4">
        {isLoading && (
          <div className="tw-space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="tw-h-36 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && tokens.length === 0 ? (
          <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-6 tw-text-center tw-text-iron-200">
            No tokens match the selected filters.
          </div>
        ) : null}

        {tokens.map((token) => (
          <TokenCard
            key={`${token.collectionId}-${token.tokenId}`}
            token={token}
            connectedProfileId={connectedProfileId}
          />
        ))}
      </div>

      <CommonTablePagination
        small={false}
        currentPage={state.page}
        setCurrentPage={onPageChange}
        totalPages={totalPages}
        haveNextPage={haveNextPage}
        loading={isLoading || isFetching}
      />
    </section>
  );
}

function TokenCard({
  token,
  connectedProfileId,
}: {
  readonly token: XtdhEcosystemToken;
  readonly connectedProfileId: string | null;
}) {
  const userGrant = connectedProfileId
    ? token.granters.find(
        (granter) => granter.profileId.toLowerCase() === connectedProfileId.toLowerCase()
      )
    : undefined;

  const userReceiving = connectedProfileId
    ? token.holderSummaries.find(
        (holder) => holder.profileId.toLowerCase() === connectedProfileId.toLowerCase()
      )
    : undefined;

  const lastUpdated = new Date(token.lastAllocatedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-center">
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-gap-4 lg:tw-items-center lg:tw-flex-1">
        <img
          src={token.tokenImage}
          alt={`${token.tokenName} artwork`}
          className="tw-h-20 tw-w-20 tw-rounded-xl tw-object-cover tw-border tw-border-iron-700"
          loading="lazy"
        />
        <div className="tw-space-y-2">
          <div className="tw-flex tw-flex-col tw-gap-1">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <h3 className="tw-text-base tw-font-semibold tw-text-iron-50 tw-m-0">
                {token.tokenName}
              </h3>
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-200">
                {token.blockchain}
              </span>
              <span className="tw-text-xs tw-text-iron-400">Updated {lastUpdated}</span>
            </div>
            <p className="tw-text-sm tw-text-iron-300 tw-m-0">
              {token.collectionName} · #{token.tokenId}
            </p>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <TokenStat label="xTDH Rate" value={`${formatValue(token.xtdhRate)} /day`} />
            <TokenStat label="Allocated" value={formatValue(token.totalXtdhAllocated)} />
            <TokenStat
              label="Grantors"
              value={token.grantorCount.toLocaleString()}
            />
          </div>
        </div>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-w-72">
        <div>
          <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300 tw-mb-1">
            Top Grantors
          </p>
          <ul className="tw-m-0 tw-list-none tw-space-y-1">
            {token.topGrantors.slice(0, 4).map((granter) => (
              <li
                key={granter.profileId}
                className="tw-flex tw-items-center tw-justify-between tw-text-sm tw-text-iron-200"
              >
                <span>{granter.displayName}</span>
                <span className="tw-text-iron-300">
                  {formatValue(granter.xtdhRateGranted)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {userGrant && (
          <p className="tw-rounded-lg tw-bg-primary-500/20 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-100">
            You allocated {formatValue(userGrant.xtdhRateGranted)} xTDH to this token.
          </p>
        )}
        {userReceiving && (
          <p className="tw-rounded-lg tw-bg-emerald-500/20 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-emerald-100">
            You hold {userReceiving.tokenCount.toLocaleString()} editions · earning{" "}
            {formatValue(userReceiving.xtdhEarned)} xTDH.
          </p>
        )}
      </div>
    </article>
  );
}

function TokenStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <span className="tw-inline-flex tw-flex-col tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-800 tw-px-3 tw-py-2">
      <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
        {label}
      </span>
      <span className="tw-text-sm tw-font-semibold tw-text-iron-50">{value}</span>
    </span>
  );
}

function formatValue(value: number): string {
  if (Number.isNaN(value)) return "-";
  return formatNumberWithCommas(Math.round(value));
}
