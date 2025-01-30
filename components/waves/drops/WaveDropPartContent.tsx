import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ApiDropPart } from "../../../generated/models/ApiDropPart";
import WaveDropPartContentMedias from "./WaveDropPartContentMedias";
import { ApiDropMentionedUser } from "../../../generated/models/ApiDropMentionedUser";
import { ReferencedNft } from "../../../entities/IDrop";
import { ApiWaveMin } from "../../../generated/models/ApiWaveMin";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import WaveDropPartContentMarkdown from "./WaveDropPartContentMarkdown";

interface WaveDropPartContentProps {
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly referencedNfts: ReferencedNft[];
  readonly wave: ApiWaveMin;
  readonly activePart: ApiDropPart;
  readonly havePreviousPart: boolean;
  readonly haveNextPart: boolean;
  readonly isStorm: boolean;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

const WaveDropPartContent: React.FC<WaveDropPartContentProps> = ({
  mentionedUsers,
  referencedNfts,
  wave,
  activePart,
  havePreviousPart,
  haveNextPart,
  isStorm,
  activePartIndex,
  setActivePartIndex,
  onQuoteClick,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  const memoizedMentionedUsers = useMemo(
    () => mentionedUsers,
    [mentionedUsers]
  );
  const memoizedReferencedNfts = useMemo(
    () => referencedNfts,
    [referencedNfts]
  );

  const renderNavigationButton = (direction: "previous" | "next") => {
    const isPrevious = direction === "previous";
    const isDisabled = isPrevious ? !havePreviousPart : !haveNextPart;
    const onClick = () =>
      setActivePartIndex(activePartIndex + (isPrevious ? -1 : 1));

    return (
      <button
        disabled={isDisabled}
        className={`${
          isDisabled
            ? "tw-text-iron-700 tw-border-iron-700 tw-cursor-default"
            : "tw-text-primary-400 tw-border-primary-400 hover:tw-bg-primary-400 hover:tw-text-white"
        } tw-bg-transparent tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={`${isPrevious ? "Previous" : "Next"} part`}
      >
        <svg
          className="tw-h-4 tw-w-4 tw-flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              isPrevious
                ? "M15.75 19.5 8.25 12l7.5-7.5"
                : "m8.25 4.5 7.5 7.5-7.5 7.5"
            }
          />
        </svg>
      </button>
    );
  };

  return (
    <div className="tw-w-full tw-flex tw-justify-between tw-space-x-3 tw-transition tw-duration-300 tw-ease-out">
      {isStorm && renderNavigationButton("previous")}
      <div
        className="tw-h-full tw-w-full"
        ref={contentRef}
      >
        <motion.div
          key={activePartIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WaveDropPartContentMarkdown
            mentionedUsers={memoizedMentionedUsers}
            referencedNfts={memoizedReferencedNfts}
            part={activePart}
            wave={wave}
            onQuoteClick={onQuoteClick}
          />
        </motion.div>
        {!!activePart.media.length && (
          <WaveDropPartContentMedias activePart={activePart} />
        )}
      </div>
      {isStorm && renderNavigationButton("next")}
    </div>
  );
};

export default WaveDropPartContent;
