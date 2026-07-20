import { useQuery } from "@tanstack/react-query";
import type { ApiWaveMentionSearchResult } from "@/generated/models/ApiWaveMentionSearchResult";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useDebouncedValue } from "./useDebouncedValue";

interface UseIdentitiesSearchProps {
  readonly handle: string;
  readonly waveId: string | null;
  readonly visibilityGroupId?: string | null | undefined;
}

export const IDENTITY_SEARCH_MIN_HANDLE_LENGTH = 3;
const IDENTITY_SEARCH_MAX_HANDLE_LENGTH = 15;

const isSearchableHandle = (handle: string) =>
  /^\w+$/.test(handle) &&
  handle.length >= IDENTITY_SEARCH_MIN_HANDLE_LENGTH &&
  handle.length <= IDENTITY_SEARCH_MAX_HANDLE_LENGTH;

export function useIdentitiesSearch({
  handle,
  waveId,
  visibilityGroupId,
}: UseIdentitiesSearchProps) {
  const debouncedHandle = useDebouncedValue(handle, 200);
  const hasSearchScope = !!waveId || visibilityGroupId !== undefined;

  const { data: identities } = useQuery<ApiWaveMentionSearchResult[]>({
    queryKey: [
      QueryKey.IDENTITY_SEARCH,
      { handle: debouncedHandle, visibilityGroupId, waveId },
    ],
    queryFn: async ({ signal }) => {
      if (!hasSearchScope) {
        return [];
      }

      const params: Record<string, string> = {
        handle: debouncedHandle,
        limit: "5",
      };
      if (!waveId && visibilityGroupId) {
        params["visibility_group_id"] = visibilityGroupId;
      }
      return await commonApiFetch<ApiWaveMentionSearchResult[]>({
        endpoint: waveId
          ? `v2/waves/${encodeURIComponent(waveId)}/mention-search`
          : "v2/waves/mention-search",
        params,
        signal,
      });
    },
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey[1] as
        | {
            visibilityGroupId?: string | null;
            waveId?: string | null;
          }
        | undefined;
      return previousParams?.waveId === waveId &&
        previousParams.visibilityGroupId === visibilityGroupId
        ? previousData
        : undefined;
    },
    enabled:
      hasSearchScope &&
      isSearchableHandle(debouncedHandle) &&
      debouncedHandle === handle,
  });

  const normalizedHandle = handle.toLowerCase();
  const visibleIdentities =
    hasSearchScope && isSearchableHandle(handle)
      ? (identities ?? []).filter((identity) =>
          identity.handle.toLowerCase().startsWith(normalizedHandle)
        )
      : [];

  return {
    identities: visibleIdentities,
  };
}
