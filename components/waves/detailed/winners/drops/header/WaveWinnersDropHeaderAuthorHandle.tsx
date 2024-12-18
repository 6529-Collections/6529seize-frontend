import Link from "next/link";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";

interface WaveWinnersDropHeaderAuthorHandleProps {
  readonly drop: ExtendedDrop;
}

export default function WaveWinnersDropHeaderAuthorHandle({
  drop,
}: WaveWinnersDropHeaderAuthorHandleProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <Link
        href={`/${drop.author.handle}`}
        className="tw-text-base tw-font-semibold tw-text-iron-50 tw-leading-none group-hover:tw-text-[#E8D48A]/80 tw-transition-colors tw-no-underline"
      >
        {drop.author.handle}
      </Link>
    </div>
  );
}
