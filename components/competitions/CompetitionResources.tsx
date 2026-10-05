"use client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import {
  competitionEndpoint,
  competitionScope,
} from "@/services/api/competitions-api";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import type { CompetitionTab } from "@/helpers/competition.helpers";
import { CompetitionState } from "./CompetitionState";
import CompetitionEntryCard from "./CompetitionEntryCard";
import CompetitionLeaderboard from "./CompetitionLeaderboard";
import CompetitionMyVotes from "./CompetitionMyVotes";
import CompetitionWinners from "./CompetitionWinners";
import CompetitionOutcomes from "./CompetitionOutcomes";
import CompetitionVoters from "./CompetitionVoters";
import CompetitionRules from "./CompetitionRules";

const useIdentity = () => {
  const { competition } = useCompetition();
  return { waveId: competition.wave_id, competitionId: competition.id };
};

function EntryFocus({ entryId }: { readonly entryId: string }) {
  const identity = useIdentity();
  const viewer = useCompetitionViewer();
  const entry = useQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "entry",
      entryId,
    ],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiCompetitionEntry>({
        endpoint: `${competitionEndpoint(identity)}/entries/${encodeURIComponent(entryId)}`,
        signal,
        errorMode: "structured",
      }),
    retry: false,
  });
  if (entry.isPending) return <CompetitionState />;
  if (
    entry.isError ||
    entry.data.competition_id !== identity.competitionId ||
    entry.data.wave_id !== identity.waveId
  )
    return (
      <CompetitionState
        error
        retry={() => {
          void entry.refetch();
        }}
      />
    );
  return (
    <CompetitionEntryCard entryId={entry.data.id} dropId={entry.data.drop_id} />
  );
}

export default function CompetitionResources({
  tab,
  onCreateDrop,
}: {
  readonly onCreateDrop?: (() => void) | undefined;
  readonly tab: CompetitionTab;
}) {
  const search = useSearchParams();
  const entryId = search.get("entry");
  if (entryId) return <EntryFocus key={entryId} entryId={entryId} />;
  switch (tab) {
    case "leaderboard":
      return <CompetitionLeaderboard onCreateDrop={onCreateDrop} />;
    case "votes":
      return <CompetitionMyVotes />;
    case "decisions":
      return <CompetitionWinners />;
    case "outcomes":
      return <CompetitionOutcomes />;
    case "voters":
      return <CompetitionVoters />;
    case "rules":
      return <CompetitionRules />;
  }
}
