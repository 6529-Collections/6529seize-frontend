import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getTimeAgoShort } from "@/helpers/Helpers";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { getWaveRoute } from "@/helpers/navigation.helpers";

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
    <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-gap-y-2">
        <div className="tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <div className="tw-flex tw-min-w-0 tw-max-w-full tw-items-start tw-gap-x-2">
            {!!drop.author.level && (
              <UserCICAndLevel
                level={drop.author.level}
                size={UserCICAndLevelSize.SMALL}
              />
            )}
            <p className="tw-m-0 tw-min-w-0 tw-text-md tw-font-semibold tw-leading-5 [overflow-wrap:anywhere]">
              {drop.author.handle ? (
                <UserProfileTooltipWrapper user={drop.author.handle}>
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/${drop.author.handle}`}
                    className="tw-rounded-sm tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
                  >
                    {drop.author.handle}
                  </Link>
                </UserProfileTooltipWrapper>
              ) : (
                <Link
                  onClick={(e) => e.stopPropagation()}
                  href={`/${drop.author.handle ?? drop.author.id}`}
                  className="tw-rounded-sm tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
                >
                  {drop.author.handle ?? drop.author.id}
                </Link>
              )}
            </p>
          </div>

          <div className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-x-2">
            <div
              aria-hidden="true"
              className="tw-size-[3px] tw-shrink-0 tw-rounded-full tw-bg-iron-700"
            />
            <p className="tw-m-0 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-400">
              {getTimeAgoShort(drop.created_at)}
            </p>
          </div>
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
            className="tw-block tw-max-w-full tw-rounded-sm tw-text-xs tw-leading-4 tw-text-iron-400 tw-no-underline tw-transition tw-duration-300 tw-ease-out [overflow-wrap:anywhere] hover:tw-text-iron-300 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          >
            {drop.wave.name}
          </Link>
        )}
      </div>
    </div>
  );
}
