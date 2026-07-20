import { useQuery } from "@tanstack/react-query";
import type { ApiWaveMentionSearchResult } from "@/generated/models/ApiWaveMentionSearchResult";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { DraftMentionSearchScope } from "@/components/drops/create/lexical/plugins/mentions/MentionSearchScopeContext";
import { useDebouncedValue } from "./useDebouncedValue";

interface UseIdentitiesSearchProps {
  readonly draftScope: DraftMentionSearchScope;
  readonly handle: string;
  readonly waveId: string | null;
}

export const IDENTITY_SEARCH_MIN_HANDLE_LENGTH = 3;
const IDENTITY_SEARCH_MAX_HANDLE_LENGTH = 15;

const isSearchableHandle = (handle: string) =>
  /^\w+$/.test(handle) &&
  handle.length >= IDENTITY_SEARCH_MIN_HANDLE_LENGTH &&
  handle.length <= IDENTITY_SEARCH_MAX_HANDLE_LENGTH;

export function useIdentitiesSearch({
  draftScope,
  handle,
  waveId,
}: UseIdentitiesSearchProps) {
  const debouncedHandle = useDebouncedValue(handle, 200);
  const draftScopeKey =
    draftScope.kind === "group"
      ? `group:${draftScope.visibilityGroupId}`
      : draftScope.kind;
  const hasSearchScope = !!waveId || draftScope.kind !== "disabled";

  const { data: identities } = useQuery<ApiWaveMentionSearchResult[]>({
    queryKey: [
      QueryKey.IDENTITY_SEARCH,
      { draftScopeKey, handle: debouncedHandle, waveId },
    ],
    queryFn: async ({ signal }) => {
      if (!hasSearchScope) {
        return [];
      }

      const params: Record<string, string> = {
        handle: debouncedHandle,
        limit: "5",
      };
      if (!waveId && draftScope.kind === "group") {
        params["visibility_group_id"] = draftScope.visibilityGroupId;
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
            draftScopeKey?: string;
            waveId?: string | null;
          }
        | undefined;
      return previousParams?.waveId === waveId &&
        previousParams.draftScopeKey === draftScopeKey
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
