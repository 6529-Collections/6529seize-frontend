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
      <p className="tw-text-md tw-mb-0 tw-font-semibold tw-leading-none">
        <UserProfileTooltipWrapper
          user={winner.drop.author.handle ?? winner.drop.author.id}
        >
          <Link
            href={`/${winner.drop.author.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-no-underline tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-underline desktop-hover:hover:tw-text-opacity-80"
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
