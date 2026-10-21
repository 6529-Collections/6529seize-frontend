"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
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
  readonly drop: ApiDrop & Pick<ExtendedDrop, "competition_context">;
  readonly fallback: ReactNode;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly voteMode?: SingleWaveDropVoteMode | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
  readonly onVoteRequestStarted?: (() => void) | undefined;
}

function getKnownContext(
  drop: CompetitionAwareDropVoteProps["drop"],
  viewer: string | null
) {
  const known = drop.competition_context;
  if (
    known?.viewer !== viewer ||
    known.waveId !== drop.wave.id ||
    known.dropId !== drop.id
  )
    return undefined;
  const { competition, entry } = known.data;
  if (competition === null && entry === null) return known.data;
  if (
    !competition ||
    !entry ||
    competition.wave_id !== drop.wave.id ||
    entry.wave_id !== drop.wave.id ||
    entry.drop_id !== drop.id ||
    entry.competition_id !== competition.id
  )
    return undefined;
  return known.data;
}

export default function CompetitionAwareDropVote(
  props: CompetitionAwareDropVoteProps
) {
  const viewer = useCompetitionViewer();
  const { drop } = props;
  const knownContext = getKnownContext(drop, viewer);
  const context = useQuery({
    queryKey: [
      QueryKey.COMPETITION_DROP_CONTEXT,
      { wave_id: drop.wave.id, drop_id: drop.id, viewer },
    ],
    queryFn: ({ signal }) =>
      fetchDropCompetitionContext(drop.wave.id, drop.id, signal),
    enabled: knownContext === undefined,
    retry: false,
    staleTime: 0,
  });
  if (!knownContext && context.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void context.refetch();
        }}
      />
    );
  const resolvedContext = knownContext ?? context.data;
  if (!resolvedContext) return <CompetitionState />;
  const { competition, entry } = resolvedContext;
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
