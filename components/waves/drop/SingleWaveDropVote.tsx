"use client";

import CompetitionAwareDropVote from "@/components/competitions/CompetitionAwareDropVote";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
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

export const SingleWaveDropVote: React.FC<SingleWaveDropVoteProps> = ({
  size = SingleWaveDropVoteSize.NORMAL,
  submissionMode = SingleWaveDropVoteSubmissionMode.WAIT_FOR_CONFIRMATION,
  ...props
}) => {
  const resolvedProps = { ...props, size, submissionMode };
  return isMultiCompetitionEnabled() &&
    props.drop.drop_type !== ApiDropType.Chat ? (
    <CompetitionAwareDropVote
      {...resolvedProps}
      fallback={<SingleWaveDropVoteContent {...resolvedProps} />}
    />
  ) : (
    <SingleWaveDropVoteContent {...resolvedProps} />
  );
};
