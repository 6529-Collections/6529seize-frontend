import React from "react";
import Link from "next/link";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";

interface WaveWinnersDropHeaderAuthorPfpProps {
  readonly drop: ExtendedDrop;
}

export default function WaveWinnersDropHeaderAuthorPfp({
  drop,
}: WaveWinnersDropHeaderAuthorPfpProps) {
  return (
    <Link
      href={`/${drop.author.handle}`}
      onClick={(e) => e.stopPropagation()}
      className="tw-transform hover:tw-scale-105 tw-transition-all tw-duration-300"
    >
      {drop.author.pfp ? (
        <img
          src={getScaledImageUri(drop.author.pfp, ImageScale.W_AUTO_H_50)}
          alt=""
          className="tw-size-10 md:tw-size-12 tw-rounded-xl tw-ring-2 tw-ring-iron-700/50 tw-object-cover"
        />
      ) : (
        <div className="tw-size-10 md:tw-size-12 tw-rounded-xl tw-ring-2 tw-ring-iron-700/50 tw-bg-iron-900" />
      )}
    </Link>
  );
}
