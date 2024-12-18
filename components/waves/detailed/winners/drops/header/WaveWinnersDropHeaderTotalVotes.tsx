import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

interface WaveWinnersDropHeaderTotalVotesProps {
  readonly drop: ApiDrop;
}

export default function WaveWinnersDropHeaderTotalVotes({
  drop,
}: WaveWinnersDropHeaderTotalVotesProps) {
  return (
    <div className="tw-flex tw-items-baseline tw-gap-x-1">
      <span
        className={`${
          drop.rating >= 0
            ? "tw-from-emerald-400 tw-to-emerald-500"
            : "tw-from-red tw-to-red"
        } tw-font-semibold tw-bg-gradient-to-r tw-bg-clip-text tw-text-transparent`}
      >
        {formatNumberWithCommas(drop.rating)}
      </span>
      <span className="tw-text-iron-400 tw-text-sm">
        {drop.wave.voting_credit_type} total
      </span>
    </div>
  );
}
