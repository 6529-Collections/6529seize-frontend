import Link from "next/link";

import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface MemeWinnerArtistInfoProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo?: boolean | undefined;
}

export default function MemeWinnerArtistInfo({
  drop,
  showWaveInfo = true,
}: MemeWinnerArtistInfoProps) {
  // Get the decision time from the winning context
  const decisionTime = drop.winning_context?.decision_time;

  return (
    <div className="tw-flex tw-items-start tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-2">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {!!drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          <p className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
            {drop.author?.handle ? (
              <UserProfileTooltipWrapper
                user={drop.author.handle ?? drop.author.id}
              >
                <Link
                  onClick={(e) => e.stopPropagation()}
                  href={`/${drop.author?.handle}`}
                  className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
                >
                  {drop.author?.handle}
                </Link>
              </UserProfileTooltipWrapper>
            ) : (
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/${drop.author?.handle ?? drop.author?.id}`}
                className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
              >
                {drop.author?.handle ?? drop.author?.id}
              </Link>
            )}
          </p>

          <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600"></div>
          <p className="tw-mb-0 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-leading-none tw-text-iron-500">
            {getTimeAgoShort(drop.created_at)}
          </p>
        </div>
        <WinnerDropBadge rank={1} decisionTime={decisionTime ?? null} />

        {showWaveInfo && drop.wave && (
          <Link
            onClick={(e) => e.stopPropagation()}
            href={getWaveRoute({
              waveId: drop.wave.id,
              isDirectMessage: false,
              isApp: false,
            })}
            className="tw-leading-0 tw-mb-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
          >
            {drop.wave.name}
          </Link>
        )}
      </div>
    </div>
  );
}
