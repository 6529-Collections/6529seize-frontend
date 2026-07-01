"use client";

import Pagination from "@/components/pagination/Pagination";
import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NextGenCollection } from "@/entities/INextgen";
import { fetchUrl } from "@/services/6529api";
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import styles from "./NextGen.module.scss";
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
    <div className="no-padding pt-4 pb-4 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="pb-3 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="d-flex justify-content-between tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h1>Collections</h1>
          <Dropdown className={styles["filterDropdown"]} drop={"down-centered"}>
            <Dropdown.Toggle>Status: {selectedStatus}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(StatusFilter).map((filter) => (
                <Dropdown.Item
                  key={`filter-${filter}`}
                  onClick={() => setSelectedStatus(filter)}
                >
                  {filter}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="pt-4 pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        {collections.map((collection) => (
          <div
            className="pb-3 tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto min-[992px]:tw-w-1/3 min-[992px]:tw-shrink-0 min-[992px]:tw-grow-0 min-[992px]:tw-basis-auto"
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
          <div className="text-center tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <h4>No collections found</h4>
          </div>
        )}
      </div>
      {totalResults > PAGE_SIZE && collectionsLoaded && (
        <div className="text-center pt-4 pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
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
