import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";

export function usePendingGrantsCount({
  grantor,
  enabled = true,
}: {
  readonly grantor: string;
  readonly enabled?: boolean | undefined;
}) {
  const queryKey = [QueryKey.TDH_GRANTS, "pending-count", grantor];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      return await commonApiFetch<ApiXTdhGrantsPage>({
        endpoint: "xtdh/grants",
        params: {
          grantor,
          page: "1",
          page_size: "1",
          status: "Pending",
        },
      });
    },
    enabled: Boolean(grantor) && enabled,
    refetchInterval: (query) => {
      const count = query.state.data?.count ?? 0;
      return count > 0 ? 5000 : false;
    },
  });

  return {
    count: data?.count ?? 0,
    isLoading,
    isError,
  };
}
