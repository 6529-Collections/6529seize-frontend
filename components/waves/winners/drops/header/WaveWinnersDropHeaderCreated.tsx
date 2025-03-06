import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";
import { getTimeAgoShort } from "../../../../../helpers/Helpers";

interface WaveWinnersDropHeaderCreatedProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderCreated({
  winner,
}: WaveWinnersDropHeaderCreatedProps) {
  return (
    <span className="tw-text-xs md:tw-text-sm tw-font-medium tw-text-iron-400 tw-leading-none">
      {getTimeAgoShort(winner.drop.created_at)}
    </span>
  );
}
