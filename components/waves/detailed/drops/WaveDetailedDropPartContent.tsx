import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import DropPartMarkdown from "../../../drops/view/part/DropPartMarkdown";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import WaveDetailedDropQuote from "./WaveDetailedDropQuote";
import { Drop } from "../../../../generated/models/Drop";
import { DropPart } from "../../../../generated/models/DropPart";
import WaveDetailedDropPartContentMedias from "./WaveDetailedDropPartContentMedias";

interface WaveDetailedDropPartContentProps {
  readonly drop: Drop;
  readonly activePart: DropPart;
  readonly havePreviousPart: boolean;
  readonly haveNextPart: boolean;
  readonly isStorm: boolean;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly checkOverflow: () => void;
  readonly showMore: boolean;
}

const WaveDetailedDropPartContent: React.FC<WaveDetailedDropPartContentProps> = ({
  drop,
  activePart,
  havePreviousPart,
  haveNextPart,
  isStorm,
  activePartIndex,
  setActivePartIndex,
  checkOverflow,
  showMore,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(1000);

  const updateContainerHeight = useCallback(() => {
    if (!contentRef.current) return;
    const firstImg = contentRef.current.querySelector("img");
    if (firstImg && firstImg.complete) {
      const imgRect = firstImg.getBoundingClientRect();
      const containerRect = contentRef.current.getBoundingClientRect();
      if (imgRect.top <= containerRect.bottom) {
        setContainerHeight(288 + firstImg.height + 288);
      }
    }
  }, []);

  useEffect(() => {
    checkOverflow();
    updateContainerHeight();
  }, [checkOverflow, updateContainerHeight]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.maxHeight = showMore ? "100%" : `${containerHeight}px`;
    }
  }, [showMore, containerHeight]);

  const renderNavigationButton = (direction: "previous" | "next") => {
    const isPrevious = direction === "previous";
    const isDisabled = isPrevious ? !havePreviousPart : !haveNextPart;
    const onClick = () => setActivePartIndex(activePartIndex + (isPrevious ? -1 : 1));

    return (
      <button
        disabled={isDisabled}
        className={`${
          isDisabled
            ? "tw-text-iron-700 tw-border-iron-700 tw-cursor-default"
            : "tw-text-primary-400 tw-border-primary-400 hover:tw-bg-primary-400 hover:tw-text-white"
        } tw-bg-transparent tw-h-6 tw-w-6 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out`}
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
            d={isPrevious ? "M15.75 19.5 8.25 12l7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"}
          />
        </svg>
      </button>
    );
  };

  return (
    <div className="tw-pt-1 tw-pb-1 tw-w-full tw-inline-flex tw-justify-between tw-space-x-3 hover:tw-bg-iron-900 tw-transition tw-duration-300 tw-ease-out">
      {isStorm && renderNavigationButton("previous")}
      <div className="tw-h-full tw-w-full" ref={contentRef}>
        <motion.div
          key={activePartIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DropPartMarkdown
            mentionedUsers={drop.mentioned_users}
            referencedNfts={drop.referenced_nfts}
            partContent={activePart.content}
            onImageLoaded={updateContainerHeight}
          />
          {activePart.quoted_drop?.drop_id && (
            <WaveDetailedDropQuote
              dropId={activePart.quoted_drop.drop_id}
              partId={activePart.quoted_drop.drop_part_id}
              maybeDrop={activePart.quoted_drop.drop ? { ...activePart.quoted_drop.drop, wave: drop.wave } : null}
            />
          )}
        </motion.div>
        {!!activePart.media.length && (
          <WaveDetailedDropPartContentMedias
            activePart={activePart}
            updateContainerHeight={updateContainerHeight}
          />
        )}
      </div>
      {isStorm && renderNavigationButton("next")}
    </div>
  );
};

export default WaveDetailedDropPartContent;
