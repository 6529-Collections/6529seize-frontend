"use client";

import { useState, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchUrl } from "@/services/6529api";
import Pagination from "@/components/pagination/Pagination";
import { ApiUploadsPage } from "@/generated/models/ApiUploadsPage";
import { ApiUploadItem } from "@/generated/models/ApiUploadItem";

import {
  formatDate,
  DownloadsLayout,
  DownloadsTable,
} from "./CommunityDownloadsHelpers";

const PAGE_SIZE = 25;

interface Props {
  readonly title: string;
  readonly url: string;
}

export default function CommunityDownloadsComponent(props: Readonly<Props>) {
  const [page, setPage] = useState(1);

  const { data, isError, isLoading } = useQuery<ApiUploadsPage>({
    queryKey: ["community-downloads", props.url, page],
    queryFn: () =>
      fetchUrl(`${props.url}?page_size=${PAGE_SIZE}&page=${page}`),
    placeholderData: keepPreviousData,
  });

  const downloads = data?.data;
  const totalResults = data?.count || 0;

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  }, []);

  return (
    <DownloadsLayout title={props.title}>
      {isLoading && !data && (
        <div className="tw-text-center tw-pb-3">
          Loading downloads...
        </div>
      )}

      {isError && (
        <div className="tw-text-center tw-text-red-500 tw-pb-3">
          Failed to load community downloads. Please try again.
        </div>
      )}

      <DownloadsTable
        data={downloads}
        columns={["Date", "Link"]}
        renderRow={(download: ApiUploadItem) => (
          <tr key={download.date.toString()}>
            <td>{formatDate(download.date.toString())}</td>
            <td>
              <a href={download.url} target="_blank" rel="noopener noreferrer">
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
            setPage={handlePageChange}
          />
        </div>
      )}
    </DownloadsLayout>
  );
}
