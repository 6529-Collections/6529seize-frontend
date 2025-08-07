import dynamic from "next/dynamic";
import { ApiDrop } from "../../../generated/models/ObjectSerializer";

export enum SingleWaveDropVoteSize {
  NORMAL = "NORMAL",
  COMPACT = "COMPACT",
  MINI = "MINI",
}

interface SingleWaveDropVoteProps {
  readonly drop: ApiDrop;
  readonly size?: SingleWaveDropVoteSize;
  readonly onVoteSuccess?: () => void;
}

const SingleWaveDropVoteContent = dynamic(
  () => import("./SingleWaveDropVoteContent").then((mod) => mod.SingleWaveDropVoteContent),
  { ssr: false }
);

export const SingleWaveDropVote: React.FC<SingleWaveDropVoteProps> = ({
  drop,
  size = SingleWaveDropVoteSize.NORMAL,
  onVoteSuccess,
}) => {
  return <SingleWaveDropVoteContent drop={drop} size={size} onVoteSuccess={onVoteSuccess} />;
}; 