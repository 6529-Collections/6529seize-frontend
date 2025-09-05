import { useEffect, useState } from "react";
import { Transaction } from "../entities/ITransaction";
import { DBResponse } from "../entities/IDBResponse";
import { fetchUrl } from "../services/6529api";
import { GRADIENT_CONTRACT, MEMES_CONTRACT } from "../constants";
import { NEXTGEN_CORE, NEXTGEN_CHAIN_ID } from "../components/nextGen/nextgen_contracts";

export enum TypeFilter {
  ALL = "All",
  AIRDROPS = "Airdrops",
  MINTS = "Mints",
  SALES = "Sales",
  TRANSFERS = "Transfers",
  BURNS = "Burns",
}

enum ContractFilter {
  ALL = "All",
  MEMES = "Memes",
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
  selectedContract: ContractFilter
): UseActivityDataReturn {
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalResults, setTotalResults] = useState(0);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setFetching(true);
    let url = `${process.env.API_ENDPOINT}/api/transactions?page_size=${pageSize}&page=${page}`;
    
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
    
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setActivity(response.data);
      setFetching(false);
    });
  }, [page, typeFilter, selectedContract, pageSize]);

  return {
    activity,
    totalResults,
    fetching,
    page,
    setPage,
  };
}

export { ContractFilter };