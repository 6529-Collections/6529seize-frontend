"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropWithoutWavesPageWithoutCount } from "@/generated/models/ApiDropWithoutWavesPageWithoutCount";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { generateUniqueKeys, mapToExtendedDrops } from "@/helpers/waves/wave-drops.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const toWaveMin = (wave: ApiWave): ApiWaveMin => {
  return {
    id: wave.id,
    name: wave.name,
    picture: wave.picture,
    description_drop_id: wave.description_drop?.id ?? "",
    authenticated_user_eligible_to_vote: wave.voting.authenticated_user_eligible,
    authenticated_user_eligible_to_participate:
      wave.participation.authenticated_user_eligible,
    authenticated_user_eligible_to_chat: wave.chat.authenticated_user_eligible,
    authenticated_user_admin: wave.wave.authenticated_user_eligible_for_admin,
    visibility_group_id: wave.visibility.scope.group?.id ?? null,
    participation_group_id: wave.participation.scope.group?.id ?? null,
    chat_group_id: wave.chat.scope.group?.id ?? null,
    voting_group_id: wave.voting.scope.group?.id ?? null,
    admin_group_id: wave.wave.admin_group.group?.id ?? null,
    voting_period_start: wave.voting.period?.min ?? null,
    voting_period_end: wave.voting.period?.max ?? null,
    voting_credit_type: wave.voting.credit_type,
    admin_drop_deletion_enabled: wave.wave.admin_drop_deletion_enabled,
    forbid_negative_votes: wave.voting.forbid_negative_votes,
    pinned: wave.pinned,
  };
};

export function useWaveDropsSearch({
  wave,
  term,
  enabled,
  size = 50,
}: {
  readonly wave: ApiWave;
  readonly term: string;
  readonly enabled: boolean;
  readonly size?: number;
}) {
  const trimmedTerm = term.trim();
  const waveMin = useMemo(() => toWaveMin(wave), [wave]);

  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.DROPS,
      { waveId: wave.id, term: trimmedTerm, size, context: "wave-search" },
    ],
    enabled: enabled && trimmedTerm.length > 0,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return await commonApiFetch<ApiDropWithoutWavesPageWithoutCount>({
        endpoint: `waves/${wave.id}/search`,
        params: {
          term: trimmedTerm,
          page: String(pageParam),
          size: String(size),
        },
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });

  const drops = useMemo<ExtendedDrop[]>(() => {
    const all = query.data?.pages.flatMap((page) => page.data) ?? [];
    if (all.length === 0) return [];
    const mapped = mapToExtendedDrops([{ wave: waveMin, drops: all }], [], false);
    return generateUniqueKeys(mapped, []);
  }, [query.data?.pages, waveMin]);

  return {
    ...query,
    drops,
  };
}
