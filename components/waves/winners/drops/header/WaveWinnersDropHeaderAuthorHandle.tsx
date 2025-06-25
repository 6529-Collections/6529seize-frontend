import React from "react";
import Link from "next/link";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";
import LazyTippy from "../../../../utils/tooltip/LazyTippy";
import UserProfileTooltip from "../../../../user/utils/profile/UserProfileTooltip";

interface WaveWinnersDropHeaderAuthorHandleProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderAuthorHandle({
  winner,
}: WaveWinnersDropHeaderAuthorHandleProps) {
  return (
    <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
      <LazyTippy
        placement="bottom"
        interactive={false}
        delay={[500, 200]}
        content={<UserProfileTooltip user={winner.drop.author.handle || winner.drop.author.id} />}>
        <Link
          href={`/${winner.drop.author.handle}`}
          onClick={(e) => e.stopPropagation()}
          className="tw-no-underline tw-text-iron-200 desktop-hover:hover:tw-underline desktop-hover:hover:tw-text-opacity-80 tw-transition tw-duration-300 tw-ease-out"
        >
          {winner.drop.author.handle}
        </Link>
      </LazyTippy>
    </p>
  );
}
