import { useQuery } from "@tanstack/react-query";
import type { ApiWaveMentionSearchResult } from "@/generated/models/ApiWaveMentionSearchResult";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useDebouncedValue } from "./useDebouncedValue";

interface UseIdentitiesSearchProps {
  readonly handle: string;
  readonly waveId: string | null;
}

/**
 * The mention typeahead only needs these fields. Both the wave-scoped
 * mention-search endpoint and the global identities search map onto it, so
 * the caller does not care which one produced a given suggestion.
 */
interface MentionSearchIdentity {
  readonly id: string;
  readonly handle: string;
  readonly display: string | null;
  readonly pfp: string | null;
}

export const IDENTITY_SEARCH_MIN_HANDLE_LENGTH = 3;
const IDENTITY_SEARCH_MAX_HANDLE_LENGTH = 15;
const IDENTITY_SEARCH_LIMIT = "5";

const isSearchableHandle = (handle: string) =>
  /^\w+$/.test(handle) &&
  handle.length >= IDENTITY_SEARCH_MIN_HANDLE_LENGTH &&
  handle.length <= IDENTITY_SEARCH_MAX_HANDLE_LENGTH;

export function useIdentitiesSearch({
  handle,
  waveId,
}: UseIdentitiesSearchProps) {
  const debouncedHandle = useDebouncedValue(handle, 200);

  const { data: identities } = useQuery<MentionSearchIdentity[]>({
    queryKey: [QueryKey.IDENTITY_SEARCH, { handle: debouncedHandle, waveId }],
    queryFn: async ({ signal }) => {
      // A wave-scoped search suggests the wave's own members. During wave
      // creation there is no wave yet (waveId === null), so fall back to the
      // global identities search — otherwise the create-wave Description step
      // can never tag anyone.
      if (waveId) {
        return await commonApiFetch<ApiWaveMentionSearchResult[]>({
          endpoint: `v2/waves/${encodeURIComponent(waveId)}/mention-search`,
          params: { handle: debouncedHandle, limit: IDENTITY_SEARCH_LIMIT },
          signal,
        });
      }
      const results = await commonApiFetch<ApiIdentity[]>({
        endpoint: `identities`,
        params: { handle: debouncedHandle, limit: IDENTITY_SEARCH_LIMIT },
        signal,
      });
      return results
        .filter(
          (identity): identity is ApiIdentity & { id: string; handle: string } =>
            Boolean(identity.id) && Boolean(identity.handle)
        )
        .map((identity) => ({
          id: identity.id,
          handle: identity.handle,
          display: identity.display,
          pfp: identity.pfp,
        }));
    },
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey[1] as
        | { waveId?: string | null }
        | undefined;
      return previousParams?.waveId === waveId ? previousData : undefined;
    },
    enabled: isSearchableHandle(debouncedHandle) && debouncedHandle === handle,
  });

  const normalizedHandle = handle.toLowerCase();
  const visibleIdentities = isSearchableHandle(handle)
    ? (identities ?? []).filter((identity) =>
        identity.handle.toLowerCase().startsWith(normalizedHandle)
      )
    : [];

  return {
    identities: visibleIdentities,
  };
}
