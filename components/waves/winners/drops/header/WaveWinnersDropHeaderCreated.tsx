import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";
import { Time } from "../../../../../helpers/time";

interface WaveWinnersDropHeaderCreatedProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderCreated({
  winner,
}: WaveWinnersDropHeaderCreatedProps) {
  return (
    <span className="tw-text-xs tw-font-medium tw-text-iron-400 tw-leading-none">
      {Time.millis(winner.drop.created_at).toLocaleDropDateAndTimeString()}
    </span>
  );
}
