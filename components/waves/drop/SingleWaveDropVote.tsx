import dynamic from "next/dynamic";
import { ApiDrop } from "../../../generated/models/ObjectSerializer";

export enum SingleWaveDropVoteSize {
  NORMAL = "NORMAL",
  COMPACT = "COMPACT",
}

interface SingleWaveDropVoteProps {
  readonly drop: ApiDrop;
  readonly size?: SingleWaveDropVoteSize;
}

const SingleWaveDropVoteContent = dynamic(
  () => import("./SingleWaveDropVoteContent").then((mod) => mod.SingleWaveDropVoteContent),
  { ssr: false }
);

export const SingleWaveDropVote: React.FC<SingleWaveDropVoteProps> = ({
  drop,
  size = SingleWaveDropVoteSize.NORMAL,
}) => {
  return <SingleWaveDropVoteContent drop={drop} size={size} />;
}; 