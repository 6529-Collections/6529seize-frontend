"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useCompetition } from "@/contexts/CompetitionContext";
import type { ApiWaveLog } from "@/generated/models/ApiWaveLog";
import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { commonApiFetch } from "@/services/api/common-api";
import { competitionEndpoint } from "@/services/api/competitions-api";
import { WaveLeaderboardRightSidebarActivityLog } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLog";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CompetitionState, COMPETITION_BUTTON } from "./CompetitionState";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export default function CompetitionVoteActivity() {
  const { competition } = useCompetition();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const onDropClick = useCompetitionDropNavigation();
  const locale = useBrowserLocale();
  const limit = 50;
  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { wave_id: competition.wave_id, competition_id: competition.id },
      "activity",
      connectedProfile?.id,
      activeProfileProxy?.id,
    ],
    queryFn: ({ pageParam, signal }) =>
      commonApiFetch<ApiWaveLog[]>({
        endpoint: `${competitionEndpoint({ waveId: competition.wave_id, competitionId: competition.id })}/activity`,
        params: { offset: String(pageParam), limit: String(limit) },
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (page, pages) =>
      page.length === limit
        ? pages.reduce((count, previous) => count + previous.length, 0)
        : undefined,
    refetchInterval: 30_000,
  });
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const logs = query.data.pages.flat();
  if (!logs.length) return <CompetitionState empty />;
  return (
    <div className="tw-space-y-3">
      {logs.map((log) => (
        <WaveLeaderboardRightSidebarActivityLog
          key={log.id}
          log={log}
          creditType={competition.voting.credit_type as ApiWaveCreditType}
          onDropClick={() => onDropClick({ id: log.drop_id })}
        />
      ))}
      {query.hasNextPage && (
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={query.isFetchingNextPage}
          onClick={() => {
            void query.fetchNextPage();
          }}
        >
          {t(locale, "competitions.more")}
        </button>
      )}
    </div>
  );
}
