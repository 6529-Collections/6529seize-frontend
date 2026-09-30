"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type {
  SingleWaveDropVoteMode,
  SingleWaveDropVoteSize,
} from "@/components/waves/drop/SingleWaveDropVote.types";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import { fetchDropCompetitionContext } from "@/services/api/competitions-api";
import { CompetitionVoteForm } from "./CompetitionVote";
import { CompetitionState } from "./CompetitionState";

interface CompetitionAwareDropVoteProps {
  readonly drop: ApiDrop;
  readonly fallback: ReactNode;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly voteMode?: SingleWaveDropVoteMode | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
  readonly onVoteRequestStarted?: (() => void) | undefined;
}

export default function CompetitionAwareDropVote(
  props: CompetitionAwareDropVoteProps
) {
  const viewer = useCompetitionViewer();
  const { drop } = props;
  const context = useQuery({
    queryKey: [
      QueryKey.COMPETITION_DROP_CONTEXT,
      { wave_id: drop.wave.id, drop_id: drop.id, viewer },
    ],
    queryFn: ({ signal }) =>
      fetchDropCompetitionContext(drop.wave.id, drop.id, signal),
    retry: false,
    staleTime: 0,
  });
  if (context.isPending) return <CompetitionState />;
  if (context.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void context.refetch();
        }}
      />
    );
  const { competition, entry } = context.data;
  if (!competition || !entry) return props.fallback;
  return (
    <CompetitionVoteForm
      competition={competition}
      entryId={entry.id}
      dropId={entry.drop_id}
      disabled={entry.status !== ApiCompetitionEntryStatus.Active}
      voteMode={props.voteMode ?? "slider"}
      size={props.size}
      onVoteSuccess={() => {
        props.onVoteSuccess?.();
        props.onVoteRequestStarted?.();
      }}
    />
  );
}
