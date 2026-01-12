import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import { publicEnv } from "@/config/env";
import { GRADIENT_CONTRACT, MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Transaction } from "@/entities/ITransaction";
import { fetchUrl } from "@/services/6529api";
import { useEffect, useState } from "react";

export enum TypeFilter {
  ALL = "All Transactions",
  AIRDROPS = "Airdrops",
  MINTS = "Mints",
  SALES = "Sales",
  TRANSFERS = "Transfers",
  BURNS = "Burns",
}

enum ContractFilter {
  ALL = "All Collections",
  MEMES = "The Memes",
  NEXTGEN = "NextGen",
  GRADIENTS = "Gradients",
}

interface UseActivityDataReturn {
  // Data
  activity: Transaction[];
  totalResults: number;

  // Loading state
  fetching: boolean;

  // Pagination
  page: number;
  setPage: (page: number) => void;
}

export function useActivityData(
  initialPage: number,
  pageSize: number,
  typeFilter: TypeFilter,
  selectedContract: ContractFilter,
  initialData?: {
    activity: Transaction[];
    totalResults: number;
  }
): UseActivityDataReturn {
  const [activity, setActivity] = useState<Transaction[]>(
    initialData?.activity || []
  );
  const [page, setPage] = useState(initialPage);
  const [totalResults, setTotalResults] = useState(
    initialData?.totalResults || 0
  );
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    // Skip initial fetch if we have initial data and filters are at defaults
    const hasInitialData = initialData && initialData.activity.length > 0;
    const isDefaultFilters =
      typeFilter === TypeFilter.ALL && selectedContract === ContractFilter.ALL;
    const isInitialPage = page === initialPage;

    if (hasInitialData && isDefaultFilters && isInitialPage) {
      return; // Use initial data, no fetch needed
    }

    setFetching(true);
    let url = `${publicEnv.API_ENDPOINT}/api/transactions?page_size=${pageSize}&page=${page}`;

    switch (typeFilter) {
      case TypeFilter.SALES:
        url += `&filter=sales`;
        break;
      case TypeFilter.TRANSFERS:
        url += `&filter=transfers`;
        break;
      case TypeFilter.AIRDROPS:
        url += `&filter=airdrops`;
        break;
      case TypeFilter.MINTS:
        url += `&filter=mints`;
        break;
      case TypeFilter.BURNS:
        url += `&filter=burns`;
        break;
    }

    switch (selectedContract) {
      case ContractFilter.MEMES:
        url += `&contract=${MEMES_CONTRACT}`;
        break;
      case ContractFilter.NEXTGEN:
        url += `&contract=${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}`;
        break;
      case ContractFilter.GRADIENTS:
        url += `&contract=${GRADIENT_CONTRACT}`;
        break;
    }

    fetchUrl(url)
      .then((response: DBResponse) => {
        setTotalResults(response.count);
        setActivity(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch activity data", error);
        setTotalResults(0);
        setActivity([]);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [page, typeFilter, selectedContract, pageSize, initialData, initialPage]);

  return {
    activity,
    totalResults,
    fetching,
    page,
    setPage,
  };
}

export { ContractFilter };
