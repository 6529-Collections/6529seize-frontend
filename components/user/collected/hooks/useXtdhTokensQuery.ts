import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { CollectionSort } from "@/entities/IProfile";
import { ApiXTdhTokensPage } from "@/generated/models/ApiXTdhTokensPage";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

interface UseXtdhTokensQueryProps {
  readonly identity: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: string;
  readonly order: string;
}

export const useXtdhTokensQuery = ({
  identity,
  page,
  pageSize,
  sort,
  order,
}: UseXtdhTokensQueryProps) => {
  return useQuery<ApiXTdhTokensPage>({
    queryKey: [
      QueryKey.XTDH_TOKENS,
      identity,
      page,
      pageSize,
      sort,
      order,
    ],
    queryFn: async () => {
      let apiSort = sort;
      if (sort === CollectionSort.XTDH) {
        apiSort = "xtdh";
      } else if (sort === CollectionSort.XTDH_DAY) {
        apiSort = "xtdh_rate";
      }

      return await commonApiFetch<ApiXTdhTokensPage>({
        endpoint: "xtdh/tokens",
        params: {
          identity,
          page: page.toString(),
          page_size: pageSize.toString(),
          sort: apiSort,
          order,
        },
      });
    },
    placeholderData: keepPreviousData,
  });
};
