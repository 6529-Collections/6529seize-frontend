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
export const IDENTITY_SEARCH_MAX_HANDLE_LENGTH = 15;

const isSearchableHandle = (handle: string) =>
  /^\w+$/.test(handle) &&
  handle.length >= IDENTITY_SEARCH_MIN_HANDLE_LENGTH &&
  handle.length <= IDENTITY_SEARCH_MAX_HANDLE_LENGTH;

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
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey[1] as
        | { waveId?: string | null }
        | undefined;
      return previousParams?.waveId === waveId ? previousData : undefined;
    },
    enabled:
      !!waveId &&
      isSearchableHandle(debouncedHandle) &&
      debouncedHandle === handle,
  });

  const normalizedHandle = handle.toLowerCase();
  const visibleIdentities =
    waveId && isSearchableHandle(handle)
      ? (identities ?? []).filter((identity) =>
          identity.handle.toLowerCase().startsWith(normalizedHandle)
        )
      : [];

  return {
    identities: visibleIdentities,
  };
}
