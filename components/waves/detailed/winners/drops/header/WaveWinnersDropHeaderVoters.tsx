import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import WaveWinnersDropHeaderVoter from "./WaveWinnersDropHeaderVoter";

interface WaveWinnersDropHeaderVotersProps {
  readonly drop: ExtendedDrop;
}

export default function WaveWinnersDropHeaderVoters({
  drop,
}: WaveWinnersDropHeaderVotersProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <div className="tw-flex -tw-space-x-1.5">
        {drop.top_raters.map((voter, index) => (
          <WaveWinnersDropHeaderVoter
            voter={voter}
            drop={drop}
            index={index}
            key={voter.profile.handle}
          />
        ))}
      </div>
      <span className="tw-text-sm tw-text-iron-400">
        {formatNumberWithCommas(drop.raters_count)}{" "}
        {drop.raters_count === 1 ? "voter" : "voters"}
      </span>
    </div>
  );
}
