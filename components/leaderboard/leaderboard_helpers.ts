"use client";

import { publicEnv } from "@/config/env";
import { useCallback, useEffect, useState } from "react";
import type { CICType } from "@/entities/IProfile";
import type { SortDirection } from "@/entities/ISort";
import { cicToType } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { Collector, Content } from "./Leaderboard";

export const LEADERBOARD_PAGE_SIZE = 50;

export enum LeaderboardCardsCollectedSort {
  level = "level",
  balance = "balance",
  unique_memes = "unique_memes",
  memes_cards_sets = "memes_cards_sets",
  boosted_tdh = "boosted_tdh",
  day_change = "day_change",
}

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

export interface LeaderboardMetrics {
  handle: string;
  consolidation_key: string;
  consolidation_display: string;
  pfp_url: string;
  balance: number;
  unique_memes: number;
  unique_memes_total: number;
  memes_cards_sets: number;
  rep_score: number;
  cic_score: number;
  primary_wallet: string;
  total_tdh: number;
  boosted_tdh: number;
  day_change: number;
  level: number;
  cic_type?: CICType | undefined;
}

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

async function fetchLeaderboardData<T>(
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
  }
): Promise<{
  count: number;
  data: T[];
  url: string;
}> {
  let walletFilter = "";
  if (query.searchWallets && query.searchWallets.length > 0) {
    walletFilter = `&search=${query.searchWallets.join(",")}`;
  }
  let mysort = sort.sort;
  let contentFilter = "";
  if (query.content !== Content.ALL) {
    contentFilter = `&content=${query.content.toLowerCase()}`;
  }
  let collectorFilter = "";
  if (query.collector !== Collector.ALL) {
    collectorFilter = `&collector=${query.collector.toLowerCase()}`;
  }
  let seasonFilter = "";
  if (query.selectedSeason > 0) {
    seasonFilter = `&season=${query.selectedSeason}`;
  }
  const url = `${endpoint}?page_size=${pageSize}&page=${page}&sort=${mysort}&sort_direction=${sort.sort_direction}${walletFilter}${contentFilter}${collectorFilter}${seasonFilter}`;
  const response = await commonApiFetch<{
    count: number;
    page: number;
    next: any;
    data: T[];
  }>({
    endpoint: url,
  });
  response.data.forEach((lead: any) => {
    lead.cic_type = cicToType(lead.cic_score);
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
  },
  setIsLoading: (isLoading: boolean) => void
) {
  const [myFetchUrl, setMyFetchUrl] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<T[]>([]);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchLeaderboardData<T>(
      endpoint,
      LEADERBOARD_PAGE_SIZE,
      page,
      sort,
      query
    );
    setTotalResults(data.count);
    setLeaderboard(data.data);
    setIsLoading(false);
    setMyFetchUrl(`${publicEnv.API_ENDPOINT}/api/${data.url}`);
  }, [
    page,
    sort.sort,
    sort.sort_direction,
    query.searchWallets,
    query.content,
    query.collector,
    query.selectedSeason,
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
