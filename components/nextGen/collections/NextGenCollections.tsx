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
    <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl no-padding pt-4 pb-4">
      <div className="tw-flex tw-flex-wrap -tw-mx-3 pb-3">
        <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0 d-flex justify-content-between">
          <h1>Collections</h1>
          <Dropdown className={styles["filterDropdown"]} drop={"down-centered"}>
            <Dropdown.Toggle>Status: {selectedStatus}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(StatusFilter).map((filter) => (
                <Dropdown.Item
                  key={`filter-${filter}`}
                  onClick={() => setSelectedStatus(filter)}>
                  {filter}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-4 pb-4">
        {collections.map((collection) => (
          <div className="tw-relative tw-px-3 tw-basis-auto tw-grow-0 tw-shrink-0 tw-w-full min-[576px]:tw-basis-auto min-[576px]:tw-grow-0 min-[576px]:tw-shrink-0 min-[576px]:tw-w-full md:tw-basis-auto md:tw-grow-0 md:tw-shrink-0 md:tw-w-1/2 min-[992px]:tw-basis-auto min-[992px]:tw-grow-0 min-[992px]:tw-shrink-0 min-[992px]:tw-w-1/3 pb-3" key={`collection-preview-${collection.id}`} style={{ maxWidth: "100%" }}>
            <NextGenCollectionPreview
              collection={collection}
              key={`gen-memes-collection-${collection.id}`}
            />
          </div>
        ))}
        {collectionsLoaded && collections.length === 0 && (
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0 text-center">
            <h4>No collections found</h4>
          </div>
        )}
      </div>
      {totalResults > PAGE_SIZE && collectionsLoaded && (
        <div className="tw-flex tw-flex-wrap -tw-mx-3 text-center pt-4 pb-4">
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