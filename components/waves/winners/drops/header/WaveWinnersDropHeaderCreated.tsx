import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";
import { getTimeAgoShort } from "../../../../../helpers/Helpers";

interface WaveWinnersDropHeaderCreatedProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderCreated({
  winner,
}: WaveWinnersDropHeaderCreatedProps) {
  return (
    <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
      {getTimeAgoShort(winner.drop.created_at)}
    </p>
  );
}
