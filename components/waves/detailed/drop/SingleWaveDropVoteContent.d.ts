import { FC } from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote";

interface SingleWaveDropVoteContentProps {
  readonly drop: ApiDrop;
  readonly size: SingleWaveDropVoteSize;
}

export const SingleWaveDropVoteContent: FC<SingleWaveDropVoteContentProps>; 