import { useQuery } from "@tanstack/react-query";
import type { ApiWaveMentionSearchResult } from "@/generated/models/ApiWaveMentionSearchResult";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useDebouncedValue } from "./useDebouncedValue";

interface UseIdentitiesSearchProps {
  readonly handle: string;
  readonly waveId: string | null;
}

export const IDENTITY_SEARCH_MIN_HANDLE_LENGTH = 3;

export function useIdentitiesSearch({
  handle,
  waveId,
}: UseIdentitiesSearchProps) {
  const debouncedHandle = useDebouncedValue(handle, 200);

  const { data: identities } = useQuery<ApiWaveMentionSearchResult[]>({
    queryKey: [QueryKey.IDENTITY_SEARCH, { handle: debouncedHandle, waveId }],
    queryFn: async ({ signal }) => {
      if (!waveId) {
        return [];
      }
      return await commonApiFetch<ApiWaveMentionSearchResult[]>({
        endpoint: `v2/waves/${encodeURIComponent(waveId)}/mention-search`,
        params: { handle: debouncedHandle, limit: "5" },
        signal,
      });
    },
    enabled:
      !!waveId &&
      debouncedHandle.length >= IDENTITY_SEARCH_MIN_HANDLE_LENGTH &&
      debouncedHandle === handle,
  });

  return {
    identities: debouncedHandle === handle ? (identities ?? []) : [],
  };
}
