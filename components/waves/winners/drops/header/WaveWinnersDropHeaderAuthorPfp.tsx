import React from "react";
import Link from "next/link";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";

interface WaveWinnersDropHeaderAuthorPfpProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderAuthorPfp({
  winner,
}: WaveWinnersDropHeaderAuthorPfpProps) {
  return (
    <Link
      href={`/${winner.drop.author.handle}`}
      onClick={(e) => e.stopPropagation()}
      className="tw-transform hover:tw-scale-105 tw-transition-all tw-duration-300"
    >
      {winner.drop.author.pfp ? (
        <img
          src={getScaledImageUri(winner.drop.author.pfp, ImageScale.W_AUTO_H_50)}
          alt=""
          className="tw-size-10 md:tw-size-12 tw-rounded-xl tw-ring-2 tw-ring-iron-700/50 tw-object-cover"
        />
      ) : (
        <div className="tw-size-10 md:tw-size-12 tw-rounded-xl tw-ring-2 tw-ring-iron-700/50 tw-bg-iron-900" />
      )}
    </Link>
  );
}
