import dynamic from "next/dynamic";
import { ApiDrop } from "../../../../generated/models/ObjectSerializer";

export enum WaveDropVoteSize {
  NORMAL = "NORMAL",
  COMPACT = "COMPACT",
}

interface WaveDropVoteProps {
  readonly drop: ApiDrop;
  readonly size?: WaveDropVoteSize;
}

const WaveDropVoteContent = dynamic(
  () => import("./WaveDropVoteContent").then((mod) => mod.WaveDropVoteContent),
  { ssr: false }
);

export const WaveDropVote: React.FC<WaveDropVoteProps> = ({
  drop,
  size = WaveDropVoteSize.NORMAL,
}) => {
  return <WaveDropVoteContent drop={drop} size={size} />;
};
