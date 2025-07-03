"use client";

import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { fetchUrl } from "../../services/6529api";
import Pagination from "../pagination/Pagination";
import { ApiUploadsPage } from "../../generated/models/ApiUploadsPage";
import { ApiUploadItem } from "../../generated/models/ApiUploadItem";

import {
  formatDate,
  DownloadsLayout,
  DownloadsTable,
} from "./CommunityDownloadsHelpers";

const PAGE_SIZE = 25;

interface Props {
  title: string;
  url: string;
}

export default function CommunityDownloadsComponent(props: Readonly<Props>) {
  const router = useRouter();

  const [downloads, setDownloads] = useState<ApiUploadItem[]>();
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    const fullUrl = `${props.url}?page_size=${PAGE_SIZE}&page=${mypage}`;
    fetchUrl(fullUrl).then((response: ApiUploadsPage) => {
      setTotalResults(response.count);
      setDownloads(response.data || []);
    });
  }

  useEffect(() => {
    fetchResults(page);
  }, [page, router.query]);

  return (
    <DownloadsLayout title={props.title}>
      <DownloadsTable
        data={downloads}
        columns={["Date", "Link"]}
        renderRow={(download: ApiUploadItem) => (
          <tr key={download.date.toString()}>
            <td>{formatDate(download.date.toString())}</td>
            <td>
              <a href={download.url} target="_blank" rel="noreferrer">
                {download.url}
              </a>
            </td>
          </tr>
        )}
      />

      {totalResults > PAGE_SIZE && (
        <div className="tw-text-center tw-pt-2 tw-pb-3">
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
    </DownloadsLayout>
  );
}
