"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCompetition } from "@/contexts/CompetitionContext";
import {
  useCompetitionResource,
  useCompetitionViewer,
} from "@/hooks/competitions/useCompetitionQueries";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  competitionScope,
  fetchCompetitionDistribution,
} from "@/services/api/competitions-api";
import { competitionOutcome } from "@/helpers/competition-presentation.helpers";
import type { ApiCompetitionOutcome } from "@/generated/models/ApiCompetitionOutcome";
import { WaveOutcomeView } from "@/components/waves/outcome/WaveOutcome";
import { CompetitionState } from "./CompetitionState";
import { CompetitionLoadMore } from "./CompetitionLoadMore";

function Outcome({ outcome }: { readonly outcome: ApiCompetitionOutcome }) {
  const { competition } = useCompetition();
  const viewer = useCompetitionViewer();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "distribution",
      outcome.id,
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchCompetitionDistribution(identity, outcome.id, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  const items =
    query.data?.pages
      .flatMap((page) => page.data)
      .map((item) => ({
        index: item.position,
        amount: item.amount,
        description: item.description,
      })) ?? [];
  return (
    <WaveOutcomeView
      outcome={competitionOutcome(outcome)}
      distribution={{
        items,
        totalCount: items.length,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: () => void query.fetchNextPage(),
        isLoading: query.isPending,
        isError: query.isError,
      }}
    />
  );
}
export default function CompetitionOutcomes() {
  const { competition } = useCompetition();
  const query = useCompetitionResource(
    { waveId: competition.wave_id, competitionId: competition.id },
    "outcomes"
  );
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return <CompetitionState error retry={() => void query.refetch()} />;
  const outcomes = query.data.pages.flatMap((page) => page.data);
  return (
    <div className="tw-space-y-3">
      {!outcomes.length && <CompetitionState empty />}
      {outcomes.map((outcome) => (
        <Outcome key={outcome.id} outcome={outcome} />
      ))}
      <CompetitionLoadMore query={query} />
    </div>
  );
}
