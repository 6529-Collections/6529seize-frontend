"use client";

import { publicEnv } from "@/config/env";
import { useCallback, useEffect, useState } from "react";
import type { DBResponse } from "@/entities/IDBResponse";
import type { CICType } from "@/entities/IProfile";
import type { SortDirection } from "@/entities/ISort";
import type { ApiConsolidatedTdhMetrics } from "@/generated/models/ApiConsolidatedTdhMetrics";
import { ApiConsolidatedTdhMetricsSort } from "@/generated/models/ApiConsolidatedTdhMetricsSort";
import type { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import { cicToType } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { Collector, Content } from "./Leaderboard";

export const LEADERBOARD_PAGE_SIZE = 50;

export const LeaderboardCardsCollectedSort = ApiConsolidatedTdhMetricsSort;
export type LeaderboardCardsCollectedSort = ApiConsolidatedTdhMetricsSort;

export enum LeaderboardInteractionsSort {
  "primary_purchases_count" = "primary_purchases_count",
  "primary_purchases_value" = "primary_purchases_value",
  "secondary_purchases_count" = "secondary_purchases_count",
  "secondary_purchases_value" = "secondary_purchases_value",
  "sales_count" = "sales_count",
  "sales_value" = "sales_value",
  "transfers_in" = "transfers_in",
  "transfers_out" = "transfers_out",
  "airdrops" = "airdrops",
  "burns" = "burns",
}

export type LeaderboardMetrics = ApiConsolidatedTdhMetrics & {
  cic_type?: CICType | undefined;
};

type LeaderboardItem = LeaderboardMetrics | LeaderboardInteractions;

export interface LeaderboardInteractions {
  handle: string;
  consolidation_key: string;
  consolidation_display: string;
  pfp_url: string;
  rep_score: number;
  cic_score: number;
  primary_wallet: string;
  boosted_tdh: number;
  day_change: number;
  level: number;
  primary_purchases_count: number;
  primary_purchases_value: number;
  secondary_purchases_count: number;
  secondary_purchases_value: number;
  sales_count: number;
  sales_value: number;
  transfers_in: number;
  transfers_out: number;
  airdrops: number;
  burns: number;
  cic_type?: CICType | undefined;
}

export function formatPercentageFromCounts(count: number, total: number) {
  const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;

  if (safeTotal === 0 || safeCount === 0) {
    return "0%";
  }

  if (safeCount >= safeTotal) {
    return "100%";
  }

  const percent = (safeCount / safeTotal) * 100;
  const rounded = Number(percent.toFixed(1));
  return rounded < 100 ? `${rounded}%` : "99.9%";
}

export function getLeaderboardDownloadFileName(
  title: string,
  block: number,
  page: number
) {
  const tdhBlockSuffix = block ? `-${block}` : "";
  const csvFileName = `${title}${tdhBlockSuffix}`;
  if (page) {
    return `${csvFileName}-page${page}.csv`;
  }
  return `${csvFileName}.csv`;
}

async function fetchLeaderboardData<T extends LeaderboardItem>(
  endpoint: string,
  pageSize: number,
  page: number,
  sort: {
    sort: string;
    sort_direction: SortDirection;
  },
  query: {
    searchWallets: string[];
    content: Content;
    collector: Collector;
    selectedSeason: number;
    tdhView?: ApiConsolidatedTdhView | undefined;
    useGeneratedFilterValues?: boolean | undefined;
  }
): Promise<{
  count: number;
  data: T[];
  url: string;
}> {
  const params = new URLSearchParams({
    page_size: pageSize.toString(),
    page: page.toString(),
    sort: sort.sort,
    sort_direction: sort.sort_direction,
  });

  if (query.searchWallets && query.searchWallets.length > 0) {
    params.set("search", query.searchWallets.join(","));
  }
  if (query.content !== Content.ALL) {
    params.set(
      "content",
      query.useGeneratedFilterValues
        ? query.content
        : query.content.toLowerCase()
    );
  }
  if (query.collector !== Collector.ALL) {
    params.set(
      "collector",
      query.useGeneratedFilterValues
        ? query.collector
        : query.collector.toLowerCase()
    );
  }
  if (query.selectedSeason > 0) {
    params.set("season", query.selectedSeason.toString());
  }
  if (query.tdhView) {
    params.set("tdh_view", query.tdhView);
  }

  const url = `${endpoint}?${params.toString()}`;
  const response = await commonApiFetch<DBResponse<T>>({
    endpoint: url,
  });
  response.data.forEach((lead: T) => {
    lead.cic_type = cicToType(Number(lead.cic_score));
  });
  return {
    count: response.count,
    data: response.data,
    url: url,
  };
}

export function useFetchLeaderboard<T extends LeaderboardItem>(
  endpoint: string,
  page: number,
  sort: {
    sort: string;
    sort_direction: SortDirection;
  },
  query: {
    searchWallets: string[];
    content: Content;
    collector: Collector;
    selectedSeason: number;
    tdhView?: ApiConsolidatedTdhView | undefined;
    useGeneratedFilterValues?: boolean | undefined;
  },
  setIsLoading: (isLoading: boolean) => void
) {
  const [myFetchUrl, setMyFetchUrl] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<T[]>([]);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboardData<T>(
        endpoint,
        LEADERBOARD_PAGE_SIZE,
        page,
        sort,
        query
      );
      setTotalResults(data.count);
      setLeaderboard(data.data);
      setMyFetchUrl(`${publicEnv.API_ENDPOINT}/api/${data.url}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    endpoint,
    page,
    sort.sort,
    sort.sort_direction,
    query.searchWallets,
    query.content,
    query.collector,
    query.selectedSeason,
    query.tdhView,
    query.useGeneratedFilterValues,
    setIsLoading,
  ]);

  useEffect(() => {
    const top = document.getElementById(`leaderboard-page`)?.offsetTop;
    if (top && window.scrollY > 0) {
      window.scrollTo(0, top);
    }
  }, [page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { myFetchUrl, totalResults, leaderboard };
}
