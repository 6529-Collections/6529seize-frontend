import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { DropPart } from "../../../../generated/models/DropPart";
import WaveDetailedDropPartContentMedias from "./WaveDetailedDropPartContentMedias";
import { DropMentionedUser } from "../../../../generated/models/DropMentionedUser";
import { ReferencedNft } from "../../../../entities/IDrop";
import { WaveMin } from "../../../../generated/models/WaveMin";
import DropPartMarkdownWithPropLogger from "../../../drops/view/part/DropPartMarkdownWithPropLogger";
import WaveDetailedDropQuoteWithDropId from "./WaveDetailedDropQuoteWithDropId";
import { Drop } from "../../../../generated/models/ObjectSerializer";

interface WaveDetailedDropPartContentProps {
  readonly mentionedUsers: DropMentionedUser[];
  readonly referencedNfts: ReferencedNft[];
  readonly wave: WaveMin;
  readonly activePart: DropPart;
  readonly havePreviousPart: boolean;
  readonly haveNextPart: boolean;
  readonly isStorm: boolean;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onQuoteClick: (drop: Drop) => void;
}

const WaveDetailedDropPartContent: React.FC<
  WaveDetailedDropPartContentProps
> = ({
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
    <div className="tw-pt-1 tw-pb-1 tw-w-full tw-flex tw-justify-between tw-space-x-3 tw-transition tw-duration-300 tw-ease-out">
      {isStorm && renderNavigationButton("previous")}
      <div
        className="tw-h-full tw-w-full xl:tw-pr-24 active:tw-bg-iron-800"
        ref={contentRef}
      >
        <motion.div
          key={activePartIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DropPartMarkdownWithPropLogger
            mentionedUsers={memoizedMentionedUsers}
            referencedNfts={memoizedReferencedNfts}
            partContent={activePart.content}
            onImageLoaded={() => {}}
            onQuoteClick={onQuoteClick}
          />
          {activePart.quoted_drop?.drop_id && (
            <div className="tw-mt-3">
              <WaveDetailedDropQuoteWithDropId
                dropId={activePart.quoted_drop.drop_id}
                partId={activePart.quoted_drop.drop_part_id}
                maybeDrop={
                  activePart.quoted_drop.drop
                    ? { ...activePart.quoted_drop.drop, wave: wave }
                    : null
                }
                onQuoteClick={onQuoteClick}
              />
            </div>
          )}
        </motion.div>
        {!!activePart.media.length && (
          <WaveDetailedDropPartContentMedias
            activePart={activePart}
            updateContainerHeight={() => {}}
          />
        )}
      </div>
      {isStorm && renderNavigationButton("next")}
    </div>
  );
};

export default WaveDetailedDropPartContent;
