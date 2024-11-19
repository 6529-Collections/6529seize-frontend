import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { ApiIdentity } from "../generated/models/ApiIdentity";
import { commonApiFetch } from "../services/api/common-api";

interface UseIdentitiesSearchProps {
  readonly handle: string;
  readonly waveId: string | null;
}

export function useIdentitiesSearch({
  handle,
  waveId,
}: UseIdentitiesSearchProps) {
  const { data: identities } = useQuery<ApiIdentity[]>({
    queryKey: [QueryKey.IDENTITY_SEARCH, { handle, waveId }],
    queryFn: async () => {
      const params: Record<string, string> = {
        handle,
      };
      if (waveId) {
        params.wave_id = waveId;
      }
      return await commonApiFetch<ApiIdentity[]>({
        endpoint: `identities`,
        params,
      });
    },
    enabled: handle.length >= 3,
  });

  return { identities: identities ?? [] };
}