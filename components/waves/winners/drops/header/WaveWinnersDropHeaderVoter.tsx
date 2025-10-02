import { Tooltip } from "react-tooltip";
import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";
import { ApiDropRater } from "@/generated/models/ApiDropRater";
import { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";

interface WaveWinnersDropHeaderVoterProps {
  readonly voter: ApiDropRater;
  readonly winner: ApiWaveDecisionWinner;
  readonly index: number;
}

export default function WaveWinnersDropHeaderVoter({
  voter,
  winner,
  index,
}: WaveWinnersDropHeaderVoterProps) {
  return (
    <>
      <div
        className="tw-relative tw-transition-transform hover:tw-scale-110 hover:tw-z-10"
        style={{ zIndex: winner.drop.top_raters.length - index }}
        data-tooltip-id={`winner-voter-${voter.profile.id}`}
      >
        <Link href={`/${voter.profile.handle}`}>
          {voter.profile.pfp ? (
            <img
              src={getScaledImageUri(voter.profile.pfp, ImageScale.W_AUTO_H_50)}
              alt={`${voter.profile.handle}'s Profile`}
              className={`tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-800 tw-object-contain`}
            />
          ) : (
            <div className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-800 tw-object-contain"></div>
          )}
        </Link>
      </div>
      <Tooltip
        id={`winner-voter-${voter.profile.id}`}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        {voter.profile.handle} • {formatNumberWithCommas(voter.rating)}{" "}
        {winner.drop.wave.voting_credit_type}
      </Tooltip>
    </>
  );
}
