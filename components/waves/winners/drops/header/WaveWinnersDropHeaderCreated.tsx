import { getTimeAgoShort } from "../../../../../helpers/Helpers";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";

interface WaveWinnersDropHeaderCreatedProps {
  readonly drop: ExtendedDrop;
}

export default function WaveWinnersDropHeaderCreated({
  drop,
}: WaveWinnersDropHeaderCreatedProps) {
  return (
    <span className="tw-text-xs md:tw-text-sm tw-font-medium tw-text-iron-400 tw-leading-none">
    {getTimeAgoShort(drop.created_at)}
  </span>
  );
}
