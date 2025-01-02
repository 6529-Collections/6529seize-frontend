import React from "react";
import Link from "next/link";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";

interface WaveWinnersDropHeaderAuthorHandleProps {
  readonly drop: ExtendedDrop;
}

export default function WaveWinnersDropHeaderAuthorHandle({
  drop,
}: WaveWinnersDropHeaderAuthorHandleProps) {
  return (
    <Link
      href={`/${drop.author.handle}`}
      onClick={(e) => e.stopPropagation()}
      className="tw-text-base md:tw-text-lg tw-font-semibold tw-text-iron-100 tw-leading-none group-hover:tw-text-iron-50  tw-no-underline desktop-hover:hover:tw-text-iron-400 tw-transition-all tw-duration-300 tw-ease-out"
    >
      {drop.author.handle}
    </Link>
  );
}
