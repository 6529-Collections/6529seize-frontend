import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../chat/WaveChat";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import { ApiDropType } from "../../../../../generated/models/ApiDropType";
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
import ParticipationDropPfp from "./ParticipationDropPfp";
import WaveDetailedDropActions from "../WaveDetailedDropActions";
import WaveDetailedDropMobileMenu from "../WaveDetailedDropMobileMenu";

interface ParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

const getColorClasses = ({
  isActiveDrop,
  rank,
  isDrop,
}: {
  isActiveDrop: boolean;
  rank: number | null;
  isDrop: boolean;
}): { container: string; text: string } => {
  if (!isDrop) return { container: "tw-bg-iron-950", text: "" };

  const rankStyles = {
    1: {
      base: "tw-border tw-border-solid tw-border-amber-400/20 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(66,56,41,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(251,191,36,0.05),0_0_15px_rgba(251,191,36,0.1)]",
      hover:
        "hover:tw-shadow-[inset_0_0_25px_rgba(251,191,36,0.1),0_0_25px_rgba(251,191,36,0.15)] hover:tw-border-amber-400/30 hover:tw-bg-[linear-gradient(90deg,rgba(35,35,41,0.92)_0%,rgba(71,61,46,0.97)_100%)]",
      active:
        "tw-border-l-4 tw-border-l-amber-400 tw-border-y tw-border-y-amber-400/20 tw-border-r tw-border-r-amber-400/20 tw-bg-[linear-gradient(90deg,rgba(66,56,41,0.95)_0%,rgba(31,31,37,0.9)_100%)] tw-shadow-[inset_0_0_30px_rgba(251,191,36,0.2)]",
    },
    2: {
      base: "tw-border tw-border-solid tw-border-slate-400/20 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(45,45,50,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(226,232,240,0.05),0_0_15px_rgba(226,232,240,0.1)]",
      hover:
        "hover:tw-shadow-[inset_0_0_25px_rgba(226,232,240,0.1),0_0_25px_rgba(226,232,240,0.15)] hover:tw-border-slate-400/30 hover:tw-bg-[linear-gradient(90deg,rgba(35,35,41,0.92)_0%,rgba(50,50,55,0.97)_100%)]",
      active:
        "tw-border-l-4 tw-border-l-slate-400 tw-border-y tw-border-y-slate-400/20 tw-border-r tw-border-r-slate-400/20 tw-bg-[linear-gradient(90deg,rgba(45,45,50,0.95)_0%,rgba(31,31,37,0.9)_100%)] tw-shadow-[inset_0_0_30px_rgba(226,232,240,0.2)]",
    },
    3: {
      base: "tw-border tw-border-solid tw-border-[#CD7F32]/20 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(60,46,36,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(205,127,50,0.05),0_0_15px_rgba(205,127,50,0.1)]",
      hover:
        "hover:tw-shadow-[inset_0_0_25px_rgba(205,127,50,0.1),0_0_25px_rgba(205,127,50,0.15)] hover:tw-border-[#CD7F32]/30 hover:tw-bg-[linear-gradient(90deg,rgba(35,35,41,0.92)_0%,rgba(65,51,41,0.97)_100%)]",
      active:
        "tw-border-l-4 tw-border-l-[#CD7F32] tw-border-y tw-border-y-[#CD7F32]/20 tw-border-r tw-border-r-[#CD7F32]/20 tw-bg-[linear-gradient(90deg,rgba(60,46,36,0.95)_0%,rgba(31,31,37,0.9)_100%)] tw-shadow-[inset_0_0_30px_rgba(205,127,50,0.2)]",
    },
    default: {
      base: "tw-border tw-border-solid tw-border-iron-600/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.95)_0%,rgba(35,35,40,0.98)_100%)] tw-shadow-[inset_0_0_16px_rgba(255,255,255,0.03)]",
      hover:
        "hover:tw-shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:tw-border-iron-500/40",
      active:
        "tw-border-l-4 tw-border-l-iron-400 tw-border-y tw-border-y-iron-400/20 tw-border-r tw-border-r-iron-400/20 tw-bg-[linear-gradient(90deg,rgba(35,35,40,0.98)_0%,rgba(31,31,37,0.95)_100%)] tw-shadow-[inset_0_0_25px_rgba(255,255,255,0.1)]",
    },
  };

  const style =
    rankStyles[rank as keyof typeof rankStyles] ?? rankStyles.default;
  const classes = [style.base, style.hover];

  if (isActiveDrop) {
    classes.push(style.active);
  }

  return {
    container: classes.join(" "),
    text: "",
  };
};

export default function ParticipationDrop({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuote,
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

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onReply, drop, activePartIndex]);

  const handleOnQuote = useCallback(() => {
    setIsSlideUp(false);
    onQuote({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onQuote, drop, activePartIndex]);

  return (
    <div className={`${location === DropLocation.WAVE ? "tw-px-4" : ""}`}>
      <div
        className={`tw-relative tw-w-full tw-rounded-xl tw-my-4 ${colorClasses.container} tw-overflow-hidden tw-backdrop-blur-sm
          tw-transition-all tw-duration-300 tw-ease-out
          tw-shadow-lg tw-shadow-black/5
          hover:tw-shadow-xl hover:tw-shadow-black/10
          tw-group`}
      >
        {!isMobile && showReplyAndQuote && (
          <WaveDetailedDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            onReply={handleOnReply}
            onQuote={handleOnQuote}
          />
        )}

        {/* Header Section */}
        <div className="tw-grid tw-grid-cols-[auto_1fr] tw-gap-5 tw-p-6">
          {/* Author Profile Section */}
          <div className="tw-relative">
            <div className="tw-rounded-lg tw-overflow-hidden tw-ring-2 tw-ring-iron-700/50 group-hover:tw-ring-iron-600/30 tw-transition-all tw-duration-300 tw-shadow-lg hover:tw-shadow-xl">
              <div className="tw-w-[52px] tw-h-[52px]">
                <ParticipationDropPfp drop={drop} />
              </div>
            </div>
            <div className="tw-absolute -tw-bottom-2 -tw-right-2">
              <UserCICAndLevel
                level={drop.author.level}
                cicType={cicType}
                size={UserCICAndLevelSize.SMALL}
              />
            </div>
          </div>

          {/* Author Info Section */}
          <div className="tw-flex tw-flex-col tw-justify-center tw-gap-1.5">
            <div className="tw-flex tw-items-center tw-gap-3">
              <p
                className={`tw-text-xl tw-m-0 tw-leading-none tw-font-bold ${colorClasses.text}`}
              >
                <Link
                  onClick={(e) => e.stopPropagation()}
                  href={`/${drop.author.handle}`}
                  className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
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
            <div className="tw-flex tw-items-center tw-gap-3 -tw-mt-0.5">
              <p
                className={`tw-text-sm tw-m-0 tw-whitespace-nowrap tw-font-medium tw-leading-none tw-text-iron-400 ${colorClasses.text}`}
              >
                {getTimeAgoShort(drop.created_at)}
              </p>
              {showWaveInfo && (
                <>
                  <div className="tw-size-[3px] tw-bg-iron-500 tw-rounded-full tw-flex-shrink-0" />
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/waves/${drop.wave.id}`}
                    className={`tw-text-sm tw-leading-none tw-font-medium tw-text-iron-400 hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out tw-no-underline ${colorClasses.text}`}
                  >
                    {drop.wave.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Section with proper containment */}
        <div className="tw-px-6 tw-pb-6">
          <div className="tw-relative tw-rounded-xl tw-overflow-hidden tw-bg-iron-950/40">
            {/* Subtle border effects */}
            <div className="tw-absolute tw-inset-0 tw-ring-1 tw-ring-inset tw-ring-iron-700/10" />
            <div className="tw-absolute tw-inset-0 tw-ring-1 tw-ring-inset tw-ring-white/[0.02]" />

            {/* Edge highlights */}
            <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/[0.05] tw-to-transparent" />
            <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/[0.03] tw-to-transparent" />

            {/* Content wrapper */}
            <div className="tw-relative">
              {/* Soft edge fades */}
              <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-8 tw-bg-gradient-to-b tw-from-iron-950/20 tw-to-transparent" />
              <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-8 tw-bg-gradient-to-t tw-from-iron-950/20 tw-to-transparent" />

              {/* Content with padding */}
              <div className="tw-relative tw-px-5 tw-py-4">
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
            </div>
          </div>
        </div>

        {/* Voting Section */}
        <div className="tw-px-6 tw-py-4 tw-border-t tw-border-iron-800/30">
          <WaveDropVote drop={drop} size={WaveDropVoteSize.COMPACT} />
        </div>

        {/* Ratings Section */}
        {!!drop.raters_count && (
          <div className="tw-px-6 tw-py-4 tw-border-t tw-border-iron-800/30">
            <ParticipationDropRatings drop={drop} rank={rank} />
          </div>
        )}
        <WaveDetailedDropMobileMenu
          drop={drop}
          isOpen={isSlideUp}
          longPressTriggered={longPressTriggered}
          showReplyAndQuote={showReplyAndQuote}
          setOpen={setIsSlideUp}
          onReply={handleOnReply}
          onQuote={handleOnQuote}
        />
      </div>
    </div>
  );
}
