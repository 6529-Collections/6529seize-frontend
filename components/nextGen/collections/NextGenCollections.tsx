"use client";

import Pagination from "@/components/pagination/Pagination";
import FilterGridDropdown from "@/components/utils/select/dropdown/FilterGridDropdown";
import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NextGenCollection } from "@/entities/INextgen";
import { fetchUrl } from "@/services/6529api";
import { useEffect, useState } from "react";
import NextGenCollectionPreview from "./NextGenCollectionPreview";

const PAGE_SIZE = 25;

enum StatusFilter {
  LIVE = "LIVE",
  UPCOMING = "UPCOMING",
  COMPLETED = "COMPLETED",
}

const STATUS_FILTER_ITEMS = [
  { value: StatusFilter.LIVE, label: "Live" },
  { value: StatusFilter.UPCOMING, label: "Upcoming" },
  { value: StatusFilter.COMPLETED, label: "Completed" },
] as const;

const COLLECTION_SKELETONS = Array.from({ length: 6 }, (_, index) => index);

export default function NextGenCollections() {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter | null>(
    null
  );
  const [collections, setCollections] = useState<NextGenCollection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setCollectionsLoaded(false);
    const statusFilter =
      selectedStatus !== null ? `&status=${selectedStatus}` : "";
    const url = `${publicEnv.API_ENDPOINT}/api/nextgen/collections?page_size=${PAGE_SIZE}&page=${page}${statusFilter}`;

    void fetchUrl<DBResponse<NextGenCollection>>(url)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setTotalResults(response.count);
        setCollections(response.data);
        setCollectionsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setTotalResults(0);
          setCollections([]);
          setCollectionsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, selectedStatus]);

  return (
    <section className="tw-py-6 sm:tw-py-8">
      <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
          Collections
        </h1>
        <div className="tw-w-full sm:tw-w-56">
          <FilterGridDropdown
            filterLabel="Status"
            triggerAriaLabel="Filter collections by status"
            items={STATUS_FILTER_ITEMS}
            selectedValue={selectedStatus}
            allItemLabel="All statuses"
            onSelect={(status) => {
              setSelectedStatus(status);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div
        className="tw-grid tw-grid-cols-1 tw-gap-4 tw-py-6 md:tw-grid-cols-2 xl:tw-grid-cols-3"
        aria-busy={!collectionsLoaded}
      >
        {!collectionsLoaded &&
          COLLECTION_SKELETONS.map((skeleton) => (
            <div
              key={`collection-skeleton-${skeleton}`}
              className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900"
              aria-hidden="true"
            >
              <div className="tw-aspect-square tw-animate-pulse tw-bg-iron-800 motion-reduce:tw-animate-none" />
              <div className="tw-space-y-3 tw-p-4">
                <div className="tw-h-5 tw-w-2/3 tw-animate-pulse tw-rounded-md tw-bg-iron-700 motion-reduce:tw-animate-none" />
                <div className="tw-h-4 tw-w-1/2 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none" />
                <div className="tw-h-4 tw-w-3/4 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none" />
              </div>
            </div>
          ))}

        {collectionsLoaded &&
          collections.map((collection) => (
            <NextGenCollectionPreview
              collection={collection}
              key={`nextgen-collection-${collection.id}`}
            />
          ))}
      </div>

      {collectionsLoaded && collections.length === 0 && (
        <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-900/50 tw-px-6 tw-py-12 tw-text-center">
          <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-200">
            No collections found
          </h2>
        </div>
      )}

      {totalResults > PAGE_SIZE && collectionsLoaded && (
        <div className="tw-flex tw-justify-center tw-py-6">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={(newPage: number) => {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}
    </section>
  );
}
