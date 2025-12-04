import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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
    queryFn: async () =>
      await commonApiFetch<ApiXTdhTokensPage>({
        endpoint: "xtdh/tokens",
        params: {
          identity,
          page: page.toString(),
          page_size: pageSize.toString(),
          sort,
          order,
        },
      }),
    placeholderData: keepPreviousData,
  });
};
