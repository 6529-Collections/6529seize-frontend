import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cicToType } from "../../../helpers/Helpers";
import { Time } from "../../../helpers/time";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "../../waves/drops/WaveDropAuthorPfp";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";

interface MemesLeaderboardDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

export const MemesLeaderboardDropArtistInfo: React.FC<
  MemesLeaderboardDropArtistInfoProps
> = ({ drop }) => {
  const [isMobile, setIsMobile] = useState(false);

  function checkMobile() {
    const screenSize = window.innerWidth;
    if (screenSize <= 640) { // Tailwind's sm breakpoint
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }

  useEffect(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <Link
        href={`/${drop.author?.handle}`}
        onClick={(e) => e.stopPropagation()}
        className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline group"
      >
        <WaveDropAuthorPfp drop={drop} />
      </Link>
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicToType(drop.author.cic)}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          <Link
            href={`/${drop.author?.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-no-underline"
          >
            <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
              {drop.author?.handle}
            </span>
          </Link>

          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>

          <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400 tw-leading-none">
            {isMobile 
              ? Time.millis(drop.created_at).toShortRelativeTime()
              : Time.millis(drop.created_at).toLocaleDropDateAndTimeString()
            }
          </span>
        </div>
        <WinnerDropBadge
          rank={drop.rank}
          decisionTime={drop.winning_context?.decision_time || null}
        />
      </div>
    </div>
  );
};

export default MemesLeaderboardDropArtistInfo;
