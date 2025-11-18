"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState, type ChangeEvent, type ReactElement } from "react";

import { getDateDisplay } from "@/helpers/Helpers";
import type { XtdhReceivedNft } from "@/types/xtdh";
import {
  type XtdhReceivedSortDirection,
  type XtdhReceivedSortField,
  useXtdhReceivedNftsQuery,
} from "@/hooks/useXtdhReceivedNftsQuery";

const SORT_OPTIONS: ReadonlyArray<{
  readonly value: XtdhReceivedSortField;
  readonly label: string;
}> = [
  { value: "xtdh_rate", label: "Incoming rate" },
  { value: "total_received", label: "Total received" },
  { value: "collection_name", label: "Collection name" },
  { value: "token_id", label: "Token ID" },
];

export interface XtdhReceivedSectionProps {
  readonly profileId: string | null;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;
const ALL_COLLECTIONS_VALUE = "__all";

export default function XtdhReceivedSection({
  profileId,
  pageSize = DEFAULT_PAGE_SIZE,
}: Readonly<XtdhReceivedSectionProps>): ReactElement {
  const [collectionFilter, setCollectionFilter] = useState<string>(ALL_COLLECTIONS_VALUE);
  const [sortField, setSortField] = useState<XtdhReceivedSortField>("xtdh_rate");
  const [sortDirection, setSortDirection] = useState<XtdhReceivedSortDirection>("desc");
  const [page, setPage] = useState(1);
  const collectionSelectId = useId();
  const sortSelectId = useId();

  useEffect(() => {
    setPage(1);
  }, [collectionFilter, sortField, sortDirection, profileId, pageSize]);

  const collections = collectionFilter === ALL_COLLECTIONS_VALUE ? undefined : [collectionFilter];

  const query = useXtdhReceivedNftsQuery({
    profileId,
    page,
    pageSize,
    sortField,
    sortDirection,
    collections,
    enabled: Boolean(profileId),
  });

  const { isLoading, isFetching } = query;
  const totalPages = Math.max(1, Math.ceil(query.totalCount / pageSize));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const isInitialLoading = query.isPending && query.tokens.length === 0;
  const isRefetching = isFetching && query.tokens.length > 0;
  const isSortingDisabled = isLoading || isFetching;

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }),
    []
  );

  const summary = useMemo(() => {
    return query.tokens.reduce(
      (acc, token) => {
        acc.rate += token.xtdhRate;
        acc.received += token.totalXtdhReceived;
        return acc;
      },
      { rate: 0, received: 0 }
    );
  }, [query.tokens]);

  const handleNextPage = () => {
    if (!hasNextPage) return;
    setPage((previous) => previous + 1);
  };

  const handlePrevPage = () => {
    if (!hasPrevPage) return;
    setPage((previous) => Math.max(1, previous - 1));
  };

  const handleCollectionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCollectionFilter(event.target.value);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSortField(event.target.value as XtdhReceivedSortField);
  };

  const toggleDirection = () => {
    setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
  };

  const handleRetry = async (): Promise<void> => {
    try {
      await query.refetch();
    } catch {
      /* query state already communicates errors */
    }
  };

  if (!profileId) {
    return (
      <section className="tailwind-scope tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 lg:tw-p-6">
        <header className="tw-flex tw-flex-col tw-gap-1 tw-mb-4">
          <h2 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-m-0">
            Received xTDH
          </h2>
          <p className="tw-text-sm tw-text-iron-300 tw-m-0">
            Select an identity to explore which NFTs are accruing xTDH from the ecosystem.
          </p>
        </header>
        <p className="tw-text-sm tw-text-iron-300 tw-m-0">
          Once a profile is selected we will surface its holdings that currently benefit from grants by
          other users, including the incoming rate, last allocation timestamp, and the supporters
          powering that capacity.
        </p>
      </section>
    );
  }

  const hasFilterApplied = Boolean(collections?.length);
  let content: ReactElement;

  if (!query.isEnabled) {
    content = (
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        Unable to load received xTDH at the moment. Please verify the selected identity.
      </p>
    );
  } else if (isInitialLoading) {
    content = (
      <output aria-live="polite" className="tw-block tw-text-sm tw-text-iron-300">
        Loading received xTDH…
      </output>
    );
  } else if (query.isError) {
    content = (
      <div className="tw-flex tw-flex-col tw-gap-3" role="alert" aria-live="polite">
        <p className="tw-text-sm tw-text-red-400 tw-m-0">
          {query.errorMessage ?? "Failed to load received xTDH."}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="tw-inline-flex tw-items-center tw-self-start tw-rounded tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-black hover:tw-bg-primary-400">
          Retry
        </button>
      </div>
    );
  } else if (query.tokens.length === 0) {
    content = (
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        {hasFilterApplied
          ? "No NFTs in this collection are receiving xTDH for this identity. Try a different filter."
          : "This identity has not yet received xTDH from other grantors. As soon as their NFTs are granted, they will appear here with full details."}
      </p>
    );
  } else {
    content = (
      <div className="tw-flex tw-flex-col tw-gap-4" aria-live="polite">
        {query.tokens.map((token) => (
          <ReceivedTokenCard
            key={`${token.contractAddress}-${token.tokenId}`}
            token={token}
            formatNumber={(value) => numberFormatter.format(value)}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="tailwind-scope tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 lg:tw-p-6 tw-flex tw-flex-col tw-gap-6">
      <header className="tw-flex tw-flex-col tw-gap-1">
        <h2 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-m-0">
          Received xTDH
        </h2>
        <p className="tw-text-sm tw-text-iron-300 tw-m-0">
          These are the NFTs currently held by this identity that are accruing xTDH from active
          grantors. Track the incoming rate, total xTDH earned, and the supporters backing each NFT.
        </p>
      </header>

      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-3" aria-live="polite">
        <Metric label="Daily incoming rate" value={`${numberFormatter.format(summary.rate)} xTDH`} />
        <Metric label="Total received this page" value={`${numberFormatter.format(summary.received)} xTDH`} />
        <Metric
          label="Visible tokens"
          value={`${query.tokens.length} / ${query.totalCount}`}
          secondary={isRefetching ? "Updating…" : undefined}
        />
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-4 tw-items-end">
        <div className="tw-flex tw-flex-col tw-gap-2">
          <label className="tw-text-sm tw-text-iron-100" htmlFor={collectionSelectId}>
            Collection filter
          </label>
          <select
            id={collectionSelectId}
            className="tw-w-56 tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-500 focus:tw-outline-none"
            value={collectionFilter}
            onChange={handleCollectionChange}
          >
            <option value={ALL_COLLECTIONS_VALUE}>All collections</option>
            {query.availableCollections.map((collection) => (
              <option key={collection.collectionId} value={collection.collectionId}>
                {collection.collectionName} ({collection.tokenCount})
              </option>
            ))}
          </select>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-2">
          <label className="tw-text-sm tw-text-iron-100" htmlFor={sortSelectId}>
            Sort by
          </label>
          <select
            id={sortSelectId}
            className="tw-w-48 tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-500 focus:tw-outline-none"
            value={sortField}
            onChange={handleSortChange}
            disabled={isSortingDisabled}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          aria-pressed={sortDirection === "desc"}
          onClick={toggleDirection}
          disabled={isSortingDisabled}
          className="tw-inline-flex tw-items-center tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 hover:tw-border-primary-500 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed">
          {sortDirection === "desc" ? "High → Low" : "Low → High"}
        </button>
      </div>

      <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-flex tw-flex-col tw-gap-4">
        {content}

        {Boolean(query.tokens.length) && (
          <div className="tw-flex tw-items-center tw-justify-between tw-pt-2 tw-border-t tw-border-iron-800 tw-text-sm tw-text-iron-200">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!hasPrevPage || query.isFetching}
              className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold disabled:tw-opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasNextPage || query.isFetching}
              className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold disabled:tw-opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  secondary,
}: Readonly<{ label: string; value: string; secondary?: string }>) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-3">
      <p className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400 tw-m-0">{label}</p>
      <p className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-mt-1 tw-mb-0">
        {value}
        {secondary && (
          <span className="tw-block tw-text-xs tw-font-normal tw-text-iron-300">{secondary}</span>
        )}
      </p>
    </div>
  );
}

function ReceivedTokenCard({
  token,
  formatNumber,
}: Readonly<{ token: XtdhReceivedNft; formatNumber: (value: number) => string }>) {
  const lastUpdated = formatRelativeTime(token.lastAllocatedAt);
  const status = getTokenStatus(token.lastAllocatedAt);
  const topGranters = token.granters.slice(0, 3);
  const remainingGranters = Math.max(token.granters.length - topGranters.length, 0);
  const holderCount = token.holderSummaries.reduce(
    (acc, holder) => acc + (holder.tokenCount ?? 0),
    0
  );

  return (
    <article className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <div className="tw-flex tw-gap-3 tw-items-center">
        <div className="tw-h-16 tw-w-16 tw-overflow-hidden tw-rounded-xl tw-bg-iron-800">
          <Image
            src={token.tokenImage}
            alt={`${token.tokenName} preview`}
            width={64}
            height={64}
            className="tw-h-full tw-w-full tw-object-cover"
          />
        </div>
        <div className="tw-flex tw-flex-col">
          <p className="tw-text-sm tw-font-semibold tw-text-iron-50 tw-m-0">
            {token.tokenName}
          </p>
          <p className="tw-text-xs tw-text-iron-400 tw-m-0">
            {token.collectionName} · Token #{token.tokenId}
          </p>
          <span className={`${status.className} tw-mt-2 tw-inline-flex tw-items-center tw-rounded-full tw-border tw-px-2 tw-py-0.5 tw-text-[0.65rem] tw-font-semibold`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="tw-flex-1 tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
        <div>
          <p className="tw-text-xs tw-text-iron-400 tw-m-0">Incoming rate</p>
          <p className="tw-text-base tw-font-semibold tw-text-iron-50 tw-m-0">
            {formatNumber(token.xtdhRate)} xTDH/day
          </p>
          <p className="tw-text-xs tw-text-iron-400 tw-mt-1 tw-mb-0">
            Total received: {formatNumber(token.totalXtdhReceived)} xTDH
          </p>
        </div>
        <div>
          <p className="tw-text-xs tw-text-iron-400 tw-m-0">Supporters</p>
          <ul className="tw-mt-1 tw-mb-0 tw-flex tw-flex-wrap tw-gap-2" aria-label={`Top grantors for ${token.tokenName}`}>
            {topGranters.map((granter) => (
              <li
                key={granter.profileId}
                className="tw-rounded-full tw-bg-iron-800 tw-px-3 tw-py-1 tw-text-xs tw-text-iron-100"
              >
                {granter.displayName} · {formatNumber(granter.xtdhRateGranted)} xTDH
              </li>
            ))}
          </ul>
          {remainingGranters > 0 && (
            <p className="tw-text-xs tw-text-iron-400 tw-mt-1 tw-mb-0">
              +{remainingGranters} more grantor{remainingGranters > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div>
          <p className="tw-text-xs tw-text-iron-400 tw-m-0">Last allocation</p>
          <p className="tw-text-sm tw-text-iron-100 tw-m-0">{lastUpdated}</p>
          <p className="tw-text-xs tw-text-iron-400 tw-mt-1 tw-mb-0">
            Grantors: {token.grantorCount} · Impacted holders: {holderCount}
          </p>
        </div>
      </div>
    </article>
  );
}

function formatRelativeTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }
  return getDateDisplay(parsed);
}

function getTokenStatus(lastAllocatedAt: string): { label: string; className: string } {
  const parsed = new Date(lastAllocatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return {
      label: "Unknown",
      className: "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-200",
    };
  }

  const daysSinceUpdate = (Date.now() - parsed.getTime()) / 86_400_000;
  if (daysSinceUpdate > 14) {
    return {
      label: "Cooling",
      className: "tw-border-orange-500/50 tw-bg-orange-900/40 tw-text-orange-100",
    };
  }

  return {
    label: "Active",
    className: "tw-border-emerald-500/40 tw-bg-emerald-900/40 tw-text-emerald-100",
  };
}
