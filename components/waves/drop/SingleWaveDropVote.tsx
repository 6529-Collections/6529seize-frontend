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
  drop,
  size = SingleWaveDropVoteSize.NORMAL,
  onVoteSuccess,
  onVoteRequestStarted,
  submissionMode = SingleWaveDropVoteSubmissionMode.WAIT_FOR_CONFIRMATION,
  voteMode,
  onVoteModeChange,
}) => {
  return (
    <SingleWaveDropVoteContent
      drop={drop}
      size={size}
      onVoteSuccess={onVoteSuccess}
      onVoteRequestStarted={onVoteRequestStarted}
      submissionMode={submissionMode}
      voteMode={voteMode}
      onVoteModeChange={onVoteModeChange}
    />
  );
};
