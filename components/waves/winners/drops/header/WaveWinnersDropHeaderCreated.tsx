import { getTimeAgoShort } from "../../../../../helpers/Helpers";
import { Time } from "../../../../../helpers/time";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";

interface WaveWinnersDropHeaderCreatedProps {
  readonly drop: ExtendedDrop;
}

export default function WaveWinnersDropHeaderCreated({
  drop,
}: WaveWinnersDropHeaderCreatedProps) {
  return (
    <span className="tw-text-xs tw-font-medium tw-text-iron-400 tw-leading-none">
      {Time.millis(drop.created_at).toLocaleDropDateAndTimeString()}
    </span>
  );
}
