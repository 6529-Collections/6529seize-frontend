"use client";

import { useAuth } from "@/components/auth/Auth";
import { MIN_WAVE_SEARCH_QUERY_LENGTH } from "@/components/waves/drops/search/waveDropsSearch.utils";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getPendingSearchFilter,
  unescapeSearchOperators,
} from "@/helpers/advanced-search.helpers";
import type { WaveSearchAuthor } from "@/services/api/wave-drops-v2.types";
import { useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";
import { useWaveDropsSearch } from "./useWaveDropsSearch";

export function useMessageSearch({
  query,
  enabled,
  initialWave = null,
}: {
  readonly query: string;
  readonly enabled: boolean;
  readonly initialWave?: ApiWave | null;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const readContext = `${connectedProfile?.id ?? "anonymous"}:${activeProfileProxy?.id ?? "direct"}`;
  const [selectedWave, setSelectedWave] = useState(initialWave);
  const [authorFilter, setAuthorFilter] = useState<WaveSearchAuthor | null>(
    null
  );
  const pendingFilter = getPendingSearchFilter(query);
  const liveNormalizedQuery = unescapeSearchOperators(
    pendingFilter?.text ?? query
  ).trim();
  const normalizedQuery = useDebouncedValue(liveNormalizedQuery, 250);
  const canSearch =
    !pendingFilter &&
    (liveNormalizedQuery.length === 0 ||
      liveNormalizedQuery.length >= MIN_WAVE_SEARCH_QUERY_LENGTH) &&
    (liveNormalizedQuery.length > 0 || authorFilter !== null);
  const isQuerySettled = liveNormalizedQuery === normalizedQuery;
  const search = useWaveDropsSearch({
    wave: selectedWave,
    allowGlobalSearch: true,
    readContext,
    term: normalizedQuery,
    authorId: authorFilter?.id,
    enabled: enabled && canSearch && isQuerySettled,
    size: 50,
  });
  const visibleResults = canSearch && isQuerySettled ? search.drops : [];
  const showLoading =
    enabled &&
    canSearch &&
    (!isQuerySettled ||
      search.isLoading ||
      (search.isFetching && visibleResults.length === 0));

  return {
    ...search,
    selectedWave,
    setSelectedWave,
    authorFilter,
    setAuthorFilter,
    readContext,
    liveNormalizedQuery,
    canSearch,
    visibleResults,
    showLoading,
    isError: canSearch && isQuerySettled && search.isError,
  };
}

export type MessageSearch = ReturnType<typeof useMessageSearch>;
