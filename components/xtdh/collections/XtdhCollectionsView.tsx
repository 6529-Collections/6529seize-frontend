"use client";

import { useMemo, useCallback } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import CommonSelect, {
  type CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import CommonSwitch from "@/components/utils/switch/CommonSwitch";
import { classNames, formatNumberWithCommas } from "@/helpers/Helpers";
import type { XtdhEcosystemCollection } from "@/types/xtdh";
import type { XtdhEcosystemCollectionsResponse } from "@/types/xtdh";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";

export const COLLECTIONS_PAGE_SIZE = 20;

export type XtdhCollectionsViewState = {
  readonly sort: "total_rate" | "recent" | "grantors" | "name" | "total_allocated";
  readonly direction: "asc" | "desc";
  readonly page: number;
  readonly networks: string[];
  readonly minRate?: number;
  readonly minGrantors?: number;
  readonly showMyGrants: boolean;
  readonly showMyReceiving: boolean;
};

const COLLECTION_SORT_ITEMS: CommonSelectItem<XtdhCollectionsViewState["sort"]>[] =
  [
    { key: "total_rate", label: "Total xTDH Rate", value: "total_rate" },
    { key: "total_allocated", label: "Total xTDH Allocated", value: "total_allocated" },
    { key: "recent", label: "Recently Updated", value: "recent" },
    { key: "grantors", label: "Number of Grantors", value: "grantors" },
    { key: "name", label: "Collection Name", value: "name" },
  ];

interface XtdhCollectionsViewProps {
  readonly state: XtdhCollectionsViewState;
  readonly connectedProfileId: string | null;
  readonly onSortChange: (sort: XtdhCollectionsViewState["sort"]) => void;
  readonly onDirectionToggle: () => void;
  readonly onNetworksChange: (networks: string[]) => void;
  readonly onMinRateChange: (value: number | undefined) => void;
  readonly onMinGrantorsChange: (value: number | undefined) => void;
  readonly onToggleMyGrants: (enabled: boolean) => void;
  readonly onToggleReceiving: (enabled: boolean) => void;
  readonly onPageChange: (page: number) => void;
  readonly query: UseQueryResult<XtdhEcosystemCollectionsResponse, Error>;
}

export default function XtdhCollectionsView({
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
}: Readonly<XtdhCollectionsViewProps>) {
  const { data, isLoading, isError, error, isFetching, refetch } = query;

  const collections = data?.collections ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.max(1, Math.ceil(totalCount / COLLECTIONS_PAGE_SIZE));
  }, [totalCount]);
  const haveNextPage = useMemo(
    () => state.page * COLLECTIONS_PAGE_SIZE < totalCount,
    [state.page, totalCount]
  );

  const availableNetworks = data?.availableFilters.networks ?? [];
  const disableInteractions = isLoading || isFetching;

  const handleNetworkToggle = useCallback(
    (network: string) => {
      const next = state.networks.includes(network)
        ? state.networks.filter((item) => item !== network)
        : [...state.networks, network];
      onNetworksChange(next);
    },
    [onNetworksChange, state.networks]
  );

  const handleMinRateInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === "") {
        onMinRateChange(undefined);
        return;
      }

      const parsed = Number.parseFloat(value);
      onMinRateChange(Number.isFinite(parsed) ? parsed : undefined);
    },
    [onMinRateChange]
  );

  const handleMinGrantorsInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === "") {
        onMinGrantorsChange(undefined);
        return;
      }

      const parsed = Number.parseInt(value, 10);
      onMinGrantorsChange(Number.isFinite(parsed) ? parsed : undefined);
    },
    [onMinGrantorsChange]
  );

  const resultSummary = useMemo(() => {
    if (isError) {
      return "Failed to load collections.";
    }
    if (isLoading) {
      return "Loading collections…";
    }
    if (isFetching) {
      return "Updating collections…";
    }
    const label = totalCount === 1 ? "collection" : "collections";
    return `Showing ${totalCount.toLocaleString()} ${label}`;
  }, [isError, isFetching, isLoading, totalCount]);

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "Unable to fetch collections.";
    return (
      <div className="tw-rounded-2xl tw-border tw-border-rose-500/40 tw-bg-rose-900/20 tw-p-6 tw-space-y-4">
        <div>
          <h3 className="tw-text-base tw-font-semibold tw-text-rose-100 tw-m-0">
            Error loading collections
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
            Collections Receiving xTDH
          </h2>
          <p className="tw-text-sm tw-text-iron-300 tw-m-0">
            Explore how xTDH is allocated across collections and identify where you or your community are active.
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

      <div
        className="tw-grid tw-gap-4 lg:tw-grid-cols-2 xl:tw-grid-cols-[1.5fr_1fr]"
        role="region"
        aria-label="Filters"
      >
        <div className="tw-space-y-3">
          <label className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
            Sort By
          </label>
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-flex-1">
              <CommonSelect
                items={COLLECTION_SORT_ITEMS}
                activeItem={state.sort}
                filterLabel="Sort collections"
                setSelected={onSortChange}
                sortDirection={state.direction}
                disabled={disableInteractions}
              />
            </div>
            <button
              type="button"
              onClick={onDirectionToggle}
              disabled={disableInteractions}
              className={classNames(
                "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0 tw-transition tw-duration-200",
                disableInteractions ? "tw-opacity-50 tw-cursor-not-allowed" : "hover:tw-bg-iron-800"
              )}
              aria-label={`Sort direction: ${state.direction === "desc" ? "descending" : "ascending"}`}
            >
              <CommonTableSortIcon direction={state.direction} isActive={true} />
            </button>
          </div>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
          <div className="tw-space-y-2">
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-m-0">
              Network
            </p>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {availableNetworks.length === 0 ? (
                <span className="tw-text-sm tw-text-iron-400">
                  {isLoading ? "Loading networks…" : "No network filters available."}
                </span>
              ) : (
                availableNetworks.map((network) => (
                  <button
                    key={network}
                    type="button"
                    onClick={() => handleNetworkToggle(network)}
                    className={classNames(
                      "tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0",
                      state.networks.includes(network)
                        ? "tw-bg-primary-500 tw-text-iron-50"
                        : "tw-bg-iron-800 tw-text-iron-200 hover:tw-bg-iron-700"
                    )}
                  >
                    {network}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <div>
              <label
                htmlFor="xtdh-min-rate"
                className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-block tw-mb-1"
              >
                Minimum xTDH Rate
              </label>
              <input
                id="xtdh-min-rate"
                name="min-rate"
                type="number"
                min={0}
                value={state.minRate ?? ""}
                onChange={handleMinRateInput}
                placeholder="Any"
                className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
              />
            </div>
            <div>
              <label
                htmlFor="xtdh-min-grantors"
                className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-block tw-mb-1"
              >
                Minimum Grantors
              </label>
              <input
                id="xtdh-min-grantors"
                name="min-grantors"
                type="number"
                min={0}
                value={state.minGrantors ?? ""}
                onChange={handleMinGrantorsInput}
                placeholder="Any"
                className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
              />
            </div>
          </div>
          <div className="tw-flex tw-flex-col tw-gap-2">
            <CommonSwitch
              label="Collections I've allocated to"
              isOn={state.showMyGrants && Boolean(connectedProfileId)}
              setIsOn={onToggleMyGrants}
            />
            <CommonSwitch
              label="Collections where I'm receiving"
              isOn={state.showMyReceiving && Boolean(connectedProfileId)}
              setIsOn={onToggleReceiving}
            />
            {!connectedProfileId && (
              <p className="tw-text-xs tw-text-amber-300 tw-m-0">
                Connect to a profile to enable personal filters.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-4">
        {isLoading && (
          <div className="tw-space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="tw-h-40 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && collections.length === 0 ? (
          <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-6 tw-text-center tw-text-iron-200">
            No collections match the current filters.
          </div>
        ) : null}

        {collections.map((collection) => (
          <CollectionCard
            key={collection.collectionId}
            collection={collection}
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

function CollectionCard({
  collection,
  connectedProfileId,
}: {
  readonly collection: XtdhEcosystemCollection;
  readonly connectedProfileId: string | null;
}) {
  const userGrant = connectedProfileId
    ? collection.granters.find(
        (granter) => granter.profileId.toLowerCase() === connectedProfileId.toLowerCase()
      )
    : undefined;

  const userReceiving = connectedProfileId
    ? collection.holderSummaries.find(
        (holder) => holder.profileId.toLowerCase() === connectedProfileId.toLowerCase()
      )
    : undefined;

  const lastUpdated = new Date(collection.lastAllocatedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-center">
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-gap-4 lg:tw-items-center lg:tw-flex-1">
        <img
          src={collection.collectionImage}
          alt={`${collection.collectionName} artwork`}
          className="tw-h-20 tw-w-20 tw-rounded-xl tw-object-cover tw-border tw-border-iron-700"
          loading="lazy"
        />
        <div className="tw-space-y-2">
          <div className="tw-flex tw-flex-col tw-gap-2">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <h3 className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-m-0">
                {collection.collectionName}
              </h3>
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-850 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-200">
                {collection.blockchain}
              </span>
              <span className="tw-text-xs tw-text-iron-400">
                Updated {lastUpdated}
              </span>
            </div>
            <p className="tw-text-sm tw-text-iron-300 tw-m-0">
              {collection.description}
            </p>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <CollectionStat label="xTDH Rate" value={`${formatValue(collection.totalXtdhRate)} /day`} />
            <CollectionStat label="Allocated" value={formatValue(collection.totalXtdhAllocated)} />
            <CollectionStat
              label="Grantors"
              value={collection.grantorCount.toLocaleString()}
            />
            <CollectionStat
              label="Receiving"
              value={`${collection.receivingTokenCount.toLocaleString()} / ${collection.tokenCount.toLocaleString()}`}
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
            {collection.topGrantors.slice(0, 4).map((granter) => (
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
            You allocated {formatValue(userGrant.xtdhRateGranted)} xTDH here.
          </p>
        )}
        {userReceiving && (
          <p className="tw-rounded-lg tw-bg-emerald-500/20 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-emerald-100">
            You hold {userReceiving.tokenCount.toLocaleString()} tokens · earning{" "}
            {formatValue(userReceiving.xtdhEarned)} xTDH.
          </p>
        )}
      </div>
    </article>
  );
}

function CollectionStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <span className="tw-inline-flex tw-flex-col tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-850 tw-px-3 tw-py-2">
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
