"use client";

import Pagination from "@/components/pagination/Pagination";
import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NextGenCollection } from "@/entities/INextgen";
import { fetchUrl } from "@/services/6529api";
import { useEffect, useState } from "react";
import NextGenCollectionPreview from "./NextGenCollectionPreview";

const PAGE_SIZE = 25;

enum StatusFilter {
  ALL = "ALL",
  LIVE = "LIVE",
  UPCOMING = "UPCOMING",
  COMPLETED = "COMPLETED",
}

export default function NextGenCollections() {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(
    StatusFilter.ALL
  );

  const [collections, setCollections] = useState<NextGenCollection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    setCollectionsLoaded(false);
    let statusFilter = "";
    if (selectedStatus !== StatusFilter.ALL) {
      statusFilter = `&status=${selectedStatus}`;
    }

    let url = `${publicEnv.API_ENDPOINT}/api/nextgen/collections?page_size=${PAGE_SIZE}&page=${mypage}${statusFilter}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setCollections(response.data);
      setCollectionsLoaded(true);
    });
  }

  useEffect(() => {
    if (page === 1) {
      fetchResults(page);
    } else {
      setPage(1);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  return (
    <div className="tw-mx-auto tw-w-full tw-px-3 tw-py-6 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="tw-[padding-bottom:1rem] -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-justify-between tw-px-3">
          <h1>Collections</h1>
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-lg tw-font-bold">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as StatusFilter)
              }
              className="tw-cursor-pointer tw-rounded-md tw-border-0 tw-bg-transparent tw-py-1 tw-pl-1 tw-pr-8 tw-font-bold tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
              style={{ colorScheme: "dark" }}
            >
              {Object.values(StatusFilter).map((filter) => (
                <option
                  key={`filter-${filter}`}
                  value={filter}
                  className="tw-bg-black tw-text-white"
                >
                  {filter}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-6">
        {collections.map((collection) => (
          <div
            className="tw-[padding-bottom:1rem] tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto min-[992px]:tw-w-1/3 min-[992px]:tw-shrink-0 min-[992px]:tw-grow-0 min-[992px]:tw-basis-auto"
            key={`collection-preview-${collection.id}`}
            style={{ maxWidth: "100%" }}
          >
            <NextGenCollectionPreview
              collection={collection}
              key={`gen-memes-collection-${collection.id}`}
            />
          </div>
        ))}
        {collectionsLoaded && collections.length === 0 && (
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-text-center">
            <h4>No collections found</h4>
          </div>
        )}
      </div>
      {totalResults > PAGE_SIZE && collectionsLoaded && (
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-6 tw-text-center">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}
    </div>
  );
}
