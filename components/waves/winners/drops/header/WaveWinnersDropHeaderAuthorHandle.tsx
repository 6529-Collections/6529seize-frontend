import React from "react";
import Link from "next/link";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";

interface WaveWinnersDropHeaderAuthorHandleProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderAuthorHandle({
  winner,
}: WaveWinnersDropHeaderAuthorHandleProps) {
  return (
    <Link
      href={`/${winner.drop.author.handle}`}
      onClick={(e) => e.stopPropagation()}
      className="tw-text-base md:tw-text-lg tw-font-semibold tw-text-iron-100 tw-leading-none group-hover:tw-text-iron-50  tw-no-underline desktop-hover:hover:tw-text-iron-400 tw-transition-all tw-duration-300 tw-ease-out"
    >
      {winner.drop.author.handle}
    </Link>
  );
}
