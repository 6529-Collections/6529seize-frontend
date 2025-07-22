"use client";

import { useState, useEffect } from "react";
import Pagination from "@/components/pagination/Pagination";
import { commonApiFetch } from "@/services/api/common-api";
import { MEMES_CONTRACT } from "@/constants";

import {
  formatDate,
  DownloadsLayout,
  DownloadsTable,
} from "./CommunityDownloadsHelpers";
import { useSetTitle } from "@/contexts/TitleContext";

const PAGE_SIZE = 25;

interface SubscriptionDownload {
  date: string;
  contract: string;
  token_id: number;
  upload_url: string;
}

export default function CommunityDownloadsSubscriptions() {
  useSetTitle("Meme Subscriptions | Open Data");

  const [downloads, setDownloads] = useState<SubscriptionDownload[]>();
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    commonApiFetch<{ count: number; data: SubscriptionDownload[] }>({
      endpoint: `subscriptions/uploads?contract=${MEMES_CONTRACT}&page_size=${PAGE_SIZE}&page=${mypage}`,
    }).then((response) => {
      setTotalResults(response.count);
      setDownloads(response.data || []);
    });
  }

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  return (
    <DownloadsLayout title="Meme Subscriptions">
      <DownloadsTable
        data={downloads}
        columns={["Date", "Token ID", "Link"]}
        renderRow={(download: SubscriptionDownload) => (
          <tr key={download.date}>
            <td>{formatDate(download.date)}</td>
            <td>#{download.token_id}</td>
            <td>
              <a href={download.upload_url} target="_blank" rel="noreferrer">
                {download.upload_url}
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
            setPage={(newPage) => {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}
    </DownloadsLayout>
  );
}
