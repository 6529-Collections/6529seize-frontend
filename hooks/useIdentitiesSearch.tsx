import { useQuery } from "@tanstack/react-query";
import { ApiIdentity } from "../generated/models/ApiIdentity";
import { commonApiFetch } from "../services/api/common-api";
import { useWaveById } from "./useWaveById";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

interface UseIdentitiesSearchProps {
  readonly handle: string;
  readonly waveId: string | null;
}

export function useIdentitiesSearch({
  handle,
  waveId,
}: UseIdentitiesSearchProps) {
  const { wave } = useWaveById(waveId);

  const { data: identities } = useQuery<ApiIdentity[]>({
    queryKey: [QueryKey.IDENTITY_SEARCH, { handle, waveId }],
    queryFn: async () => {
      const params: Record<string, string> = {
        handle,
      };
      if (waveId) {
        if (wave?.visibility.scope.group?.id) {
          params.group_id = wave.visibility.scope.group.id;
        } else {
          params.wave_id = waveId;
        }
        params.ignore_authenticated_user = "true";
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
