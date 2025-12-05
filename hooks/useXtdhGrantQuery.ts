import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { commonApiFetch } from "@/services/api/common-api";

export interface UseXtdhGrantQueryParams {
  readonly grantId: string | null;
  readonly enabled?: boolean;
}

export type UseXtdhGrantQueryResult = UseQueryResult<ApiXTdhGrant, Error> & {
  readonly grant: ApiXTdhGrant | undefined;
  readonly errorMessage?: string;
  readonly isEnabled: boolean;
};

const DEFAULT_STALE_TIME = 30_000; // 30 seconds

export function useXtdhGrantQuery({
  grantId,
  enabled = true,
}: Readonly<UseXtdhGrantQueryParams>): UseXtdhGrantQueryResult {
  const isEnabled = Boolean(grantId) && enabled;

  const query = useQuery({
    queryKey: [QueryKey.TDH_GRANTS, grantId],
    queryFn: async () => {
      if (!grantId) {
        throw new Error("Grant ID is required");
      }
      return await commonApiFetch<ApiXTdhGrant>({
        endpoint: `xtdh/grants/${grantId}`,
      });
    },
    enabled: isEnabled,
    staleTime: DEFAULT_STALE_TIME,
  });

  const errorMessage = query.error instanceof Error ? query.error.message : undefined;

  return {
    ...query,
    grant: query.data,
    errorMessage,
    isEnabled,
  };
}
