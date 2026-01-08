import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { CollectionSort } from "@/entities/IProfile";
import type { ApiXTdhTokensPage } from "@/generated/models/ApiXTdhTokensPage";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

interface UseXtdhTokensQueryProps {
  readonly identity: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: string;
  readonly order: string;
  readonly contract?: string | null | undefined;
}

export const useXtdhTokensQuery = ({
  identity,
  page,
  pageSize,
  sort,
  order,
  contract,
}: UseXtdhTokensQueryProps) => {
  return useQuery<ApiXTdhTokensPage>({
    queryKey: [
      QueryKey.XTDH_TOKENS,
      identity,
      page,
      pageSize,
      sort,
      order,
      contract,
    ],
    queryFn: async () => {
      let apiSort = sort;
      if (sort === CollectionSort.XTDH) {
        apiSort = "xtdh";
      } else if (sort === CollectionSort.XTDH_DAY) {
        apiSort = "xtdh_rate";
      }

      const params: Record<string, string> = {
        identity,
        page: page.toString(),
        page_size: pageSize.toString(),
        sort: apiSort,
        order,
      };

      if (contract) {
        params["contract"] = contract;
      }

      return await commonApiFetch<ApiXTdhTokensPage>({
        endpoint: "xtdh/tokens",
        params,
      });
    },
    placeholderData: keepPreviousData,
  });
};
