"use client";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";

import { useQuery } from "@tanstack/react-query";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { CompetitionVoteForm } from "@/components/competitions/CompetitionVote";
import { CompetitionState } from "@/components/competitions/CompetitionState";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import { fetchDropCompetitionContext } from "@/services/api/competitions-api";
import dynamic from "next/dynamic";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  type SingleWaveDropVoteMode,
  SingleWaveDropVoteSize,
  SingleWaveDropVoteSubmissionMode,
} from "./SingleWaveDropVote.types";

export { SingleWaveDropVoteSize };

interface SingleWaveDropVoteProps {
  readonly drop: ApiDrop;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
  readonly onVoteRequestStarted?: (() => void) | undefined;
  readonly submissionMode?: SingleWaveDropVoteSubmissionMode | undefined;
  readonly voteMode?: SingleWaveDropVoteMode | undefined;
  readonly onVoteModeChange?:
    | ((voteMode: SingleWaveDropVoteMode) => void)
    | undefined;
}

const SingleWaveDropVoteContent = dynamic(
  () =>
    import("./SingleWaveDropVoteContent").then(
      (mod) => mod.SingleWaveDropVoteContent
    ),
  { ssr: false }
);

function CompetitionAwareDropVote(props: SingleWaveDropVoteProps) {
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
  if (!competition || !entry)
    return (
      <SingleWaveDropVoteContent
        {...props}
        size={props.size ?? SingleWaveDropVoteSize.NORMAL}
      />
    );
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

export const SingleWaveDropVote: React.FC<SingleWaveDropVoteProps> = ({
  size = SingleWaveDropVoteSize.NORMAL,
  submissionMode = SingleWaveDropVoteSubmissionMode.WAIT_FOR_CONFIRMATION,
  ...props
}) => {
  const resolvedProps = { ...props, size, submissionMode };
  return isMultiCompetitionEnabled() &&
    props.drop.drop_type !== ApiDropType.Chat ? (
    <CompetitionAwareDropVote {...resolvedProps} />
  ) : (
    <SingleWaveDropVoteContent {...resolvedProps} />
  );
};
