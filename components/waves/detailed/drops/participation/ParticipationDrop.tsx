import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../chat/WaveChat";

import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import WaveDetailedDrop from "../WaveDetailedDrop";
import { ApiDropType } from "../../../../../generated/models/ApiDropType";
import WaveDetailedDropAuthorPfp from "../WaveDetailedDropAuthorPfp";

import { cicToType, getTimeAgoShort } from "../../../../../helpers/Helpers";
import Link from "next/link";
import { UserCICAndLevelSize } from "../../../../user/utils/UserCICAndLevel";
import UserCICAndLevel from "../../../../user/utils/UserCICAndLevel";
import { DropTrophyIcon } from "../../../utils/DropThrophyIcon";
import WaveDetailedDropContent from "../WaveDetailedDropContent";
import { useCallback, useState } from "react";
import useIsMobileDevice from "../../../../../hooks/isMobileDevice";
import { WaveDropVote, WaveDropVoteSize } from "../../drop/WaveDropVote";
import { ParticipationDropRatings } from "./ParticipationDropRatings";

interface ParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

const RANK_STYLES = {
  1: "tw-border tw-border-solid tw-border-[#E8D48A]/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(66,56,41,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(217,169,98,0.15)] hover:tw-shadow-[inset_0_0_25px_rgba(217,169,98,0.2)]",
  2: "tw-border tw-border-solid tw-border-[#DDDDDD]/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(45,45,50,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(192,192,192,0.1)] hover:tw-shadow-[inset_0_0_25px_rgba(192,192,192,0.15)]",
  3: "tw-border tw-border-solid tw-border-[#CD7F32]/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(60,46,36,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(205,127,50,0.1)] hover:tw-shadow-[inset_0_0_25px_rgba(205,127,50,0.15)]",
  default:
    "tw-border tw-border-solid tw-border tw-border-iron-600/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.95)_0%,rgba(35,35,40,0.98)_100%)] tw-shadow-[inset_0_0_16px_rgba(255,255,255,0.03)] hover:tw-shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]",
} as const;

const RANK_SEPARATOR_STYLES = {
  1: "before:tw-bg-[#E8D48A]",
  2: "before:tw-bg-[#DDDDDD]",
  3: "before:tw-bg-[#CD7F32]",
  default: "before:tw-bg-iron-600",
} as const;

const getColorClasses = ({
  isActiveDrop,
  rank,
  isDrop,
}: {
  isActiveDrop: boolean;
  rank: number | null;
  isDrop: boolean;
}): string => {
  if (isActiveDrop) {
    return "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0";
  }
  if (!isDrop) return "tw-bg-iron-950";

  const rankClass =
    RANK_STYLES[rank as keyof typeof RANK_STYLES] ?? RANK_STYLES.default;
  return `${rankClass} tw-transition-shadow tw-duration-300`.trim();
};

export default function ParticipationDrop({
  drop,
  previousDrop,
  nextDrop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  dropViewDropId,
  onReply,
  onQuote,
  onReplyClick,
  onQuoteClick,
  onDropClick,
  parentContainerRef,
}: ParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isDrop = drop.drop_type === ApiDropType.Participatory;
  const rank = drop.rank;
  const cicType = cicToType(drop.author.cic);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const isMobile = useIsMobileDevice();
  const colorClasses = getColorClasses({ isActiveDrop, rank, isDrop });
  const handleLongPress = useCallback(() => {
    if (!isMobile) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [isMobile]);
  const handleDropClick = useCallback(() => {
    onDropClick(drop);
  }, [onDropClick, drop]);

  return (
    <div
      className={`tw-relative tw-w-full tw-rounded-xl tw-my-2 ${colorClasses} tw-overflow-hidden tw-backdrop-blur-sm`}
    >
      <div className="tw-px-6 tw-py-5">
        <div className="tw-flex tw-items-center tw-space-x-5">
          <div className="tw-relative tw-group">
            <div className="tw-rounded-lg tw-overflow-hidden tw-ring-2 tw-ring-iron-700/50 group-hover:tw-ring-iron-600 tw-transition-all tw-duration-300">
              <WaveDetailedDropAuthorPfp drop={drop} />
            </div>
            <div className="tw-absolute -tw-bottom-1.5 -tw-right-1.5 tw-transform group-hover:tw-scale-110 tw-transition-transform tw-duration-300">
              <UserCICAndLevel
                level={drop.author.level}
                cicType={cicType}
                size={UserCICAndLevelSize.SMALL}
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-w-full">
              <div className="tw-flex tw-flex-col tw-gap-2">
                <div className="tw-flex tw-items-center tw-gap-x-3">
                  <p className="tw-text-lg tw-mb-0 tw-leading-none tw-font-semibold">
                    <Link
                      onClick={(e) => e.stopPropagation()}
                      href={`/${drop.author.handle}`}
                      className="tw-no-underline tw-text-iron-50 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
                    >
                      {drop.author.handle}
                    </Link>
                  </p>
                  {isDrop && (
                    <div className="tw-flex tw-items-center tw-justify-center tw-h-6">
                      <DropTrophyIcon rank={rank} />
                    </div>
                  )}
                </div>
                <div className="tw-flex tw-items-center tw-gap-x-2">
                  <p className="tw-text-sm tw-mb-0 tw-whitespace-nowrap tw-font-medium tw-leading-none tw-text-iron-400">
                    {getTimeAgoShort(drop.created_at)}
                  </p>
                  {showWaveInfo && (
                    <>
                      <div className="tw-size-[3px] tw-bg-iron-500 tw-rounded-full tw-flex-shrink-0" />
                      <Link
                        onClick={(e) => e.stopPropagation()}
                        href={`/waves/${drop.wave.id}`}
                        className="tw-text-sm tw-leading-none tw-font-medium tw-text-iron-400 hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
                      >
                        {drop.wave.name}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-px-6 tw-pb-6">
        <WaveDetailedDropContent
          drop={drop}
          activePartIndex={activePartIndex}
          setActivePartIndex={setActivePartIndex}
          onLongPress={handleLongPress}
          onDropClick={handleDropClick}
          onQuoteClick={onQuoteClick}
          setLongPressTriggered={setLongPressTriggered}
          parentContainerRef={parentContainerRef}
        />
      </div>

      <div className="tw-px-6 tw-pt-2 tw-pb-4">
        <WaveDropVote drop={drop} size={WaveDropVoteSize.COMPACT} />
      </div>

      {!!drop.raters_count && (
        <div className="tw-px-6 tw-pb-5">
          <ParticipationDropRatings drop={drop} />
        </div>
      )}
    </div>
  );
}
