import dynamic from "next/dynamic";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote.types";

export { SingleWaveDropVoteSize };

interface SingleWaveDropVoteProps {
  readonly drop: ApiDrop;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
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
}) => {
  return (
    <SingleWaveDropVoteContent
      drop={drop}
      size={size}
      onVoteSuccess={onVoteSuccess}
    />
  );
};
