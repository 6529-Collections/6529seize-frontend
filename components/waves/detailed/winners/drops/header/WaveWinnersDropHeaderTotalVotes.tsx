import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

interface WaveWinnersDropHeaderTotalVotesProps {
  readonly drop: ApiDrop;
}

export default function WaveWinnersDropHeaderTotalVotes({
  drop,
}: WaveWinnersDropHeaderTotalVotesProps) {
  const topThreeRankStyles: { [key: number]: string } = {
    1: "tw-text-[#E8D48A]",
    2: "tw-text-[#DDDDDD]",
    3: "tw-text-[#CD7F32]",
  };

  const style = drop.rank && drop.rank <= 3 
    ? topThreeRankStyles[drop.rank] 
    : drop.rating >= 0 
    ? "tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent"
    : "tw-bg-gradient-to-r tw-from-red tw-to-red tw-bg-clip-text tw-text-transparent";

  return (
    <div className="tw-flex tw-items-baseline tw-gap-x-1">
      <span className={`tw-font-semibold ${style}`}>
        {formatNumberWithCommas(drop.rating)}
      </span>
      <span className="tw-text-iron-400 tw-text-sm">
        {drop.wave.voting_credit_type} total
      </span>
    </div>
  );
}
