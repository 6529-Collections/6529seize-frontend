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
    <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
      <Link
        href={`/${winner.drop.author.handle}`}
        onClick={(e) => e.stopPropagation()}
        className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
      >
        {winner.drop.author.handle}
      </Link>
    </p>
  );
}
