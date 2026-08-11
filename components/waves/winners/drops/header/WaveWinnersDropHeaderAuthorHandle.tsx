import Link from "next/link";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";

interface WaveWinnersDropHeaderAuthorHandleProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderAuthorHandle({
  winner,
}: WaveWinnersDropHeaderAuthorHandleProps) {
  return (
    <>
      <p className="tw-m-0 tw-text-md tw-font-semibold tw-leading-none">
        <UserProfileTooltipWrapper
          user={winner.drop.author.handle ?? winner.drop.author.id}
        >
          <Link
            href={`/${winner.drop.author.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
          >
            {winner.drop.author.handle}
          </Link>
        </UserProfileTooltipWrapper>
      </p>
      <UserCICAndLevel
        level={winner.drop.author.level}
        size={UserCICAndLevelSize.SMALL}
      />
    </>
  );
}
