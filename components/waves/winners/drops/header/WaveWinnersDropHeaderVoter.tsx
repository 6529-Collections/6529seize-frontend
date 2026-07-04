import { Tooltip } from "react-tooltip";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { ApiDropRater } from "@/generated/models/ApiDropRater";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";

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
  const voterLabel = voter.profile.handle ?? voter.profile.primary_address;

  return (
    <>
      <div
        className="tw-relative tw-transition-transform hover:tw-z-10 hover:tw-scale-110"
        style={{ zIndex: winner.drop.top_raters.length - index }}
        data-tooltip-id={`winner-voter-${voter.profile.id}`}
      >
        <Link href={`/${voterLabel}`}>
          {voter.profile.pfp ? (
            // Winner voter avatars can come from arbitrary remote hosts, so this stays unoptimized.
            <img
              src={getScaledImageUri(voter.profile.pfp, ImageScale.W_AUTO_H_50)}
              alt={`${voterLabel}'s Profile`}
              className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
            />
          ) : (
            <div className="tw-h-6 tw-w-6 tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800"></div>
          )}
        </Link>
      </div>
      <Tooltip
        id={`winner-voter-${voter.profile.id}`}
        place="top"
        offset={8}
        opacity={1}
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
      >
        {voterLabel} • {formatNumberWithCommas(voter.rating)}{" "}
        {WAVE_VOTING_LABELS[winner.drop.wave.voting_credit_type]}
      </Tooltip>
    </>
  );
}
