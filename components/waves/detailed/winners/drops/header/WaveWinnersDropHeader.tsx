import React from "react";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import { UserCICAndLevelSize } from "../../../../../user/utils/UserCICAndLevel";
import {
  cicToType,
  formatNumber,
  formatNumberWithCommas,
  getTimeAgoShort,
} from "../../../../../../helpers/Helpers";
import UserCICAndLevel from "../../../../../user/utils/UserCICAndLevel";
import Link from "next/link";
import WaveWinnersDropHeaderTotalVotes from "./WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./WaveWinnersDropHeaderVoters";
import WaveWinnersDropHeaderAuthorPfp from "./WaveWinnersDropHeaderAuthorPfp";
import WaveWinnersDropHeaderRank from "./WaveWinnersDropHeaderRank";
import WaveWinnersDropHeaderAuthorHandle from "./WaveWinnersDropHeaderAuthorHandle";
import WaveWinnersDropHeaderCreated from "./WaveWinnersDropHeaderCreated";

interface WaveWinnersDropHeaderProps {
  readonly drop: ExtendedDrop;
}

export const WaveWinnersDropHeader: React.FC<WaveWinnersDropHeaderProps> = ({
  drop,
}) => {
  return (
    <div className="tw-flex tw-items-center tw-justify-between">
      <div className="tw-flex tw-items-center tw-gap-3.5 tw-no-underline group">
        <div className="tw-flex tw-items-center tw-gap-4">
          <WaveWinnersDropHeaderRank drop={drop} />
          <WaveWinnersDropHeaderAuthorPfp drop={drop} />
        </div>
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          <WaveWinnersDropHeaderAuthorHandle drop={drop} />
          <WaveWinnersDropHeaderCreated drop={drop} />
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-gap-4">
        <WaveWinnersDropHeaderTotalVotes drop={drop} />
        <WaveWinnersDropHeaderVoters drop={drop} />
      </div>
    </div>
  );
};
