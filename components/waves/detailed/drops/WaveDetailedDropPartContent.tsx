import React, { useEffect, useState } from "react";
import DropPartMarkdown from "../../../drops/view/part/DropPartMarkdown";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import { Drop } from "../../../../generated/models/Drop";
import { DropPart } from "../../../../generated/models/DropPart";
import WaveDetailedDropQuote from "./WaveDetailedDropQuote";
import { motion } from "framer-motion";

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

const WaveDetailedDropPartContent: React.FC<
  WaveDetailedDropPartContentProps
> = ({
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

  useEffect(() => {
    checkOverflow();
  }, [contentRef]);

  useEffect(() => {
    if (showMore) {
      contentRef.current?.style.setProperty("max-height", "100%");
    } else {
      contentRef.current?.style.setProperty(
        "max-height",
        `${containerHeight}px`
      );
    }
  }, [showMore, contentRef, containerHeight]);

  const onImageLoaded = () => {
    if (!contentRef.current) return;
    const imgs = contentRef.current.querySelectorAll("img");
    if (imgs.length) {
      const firstImg = imgs[0];
      if (firstImg.complete) {
        const imgRect = firstImg.getBoundingClientRect();
        const containerRect = contentRef.current.getBoundingClientRect();
        const isTopVisible = imgRect.top <= containerRect.bottom;
        if (isTopVisible) {
          setContainerHeight(288 + firstImg.height + 288);
        }
      }
    }
  };
  return (
    <div className="tw-mt-1 tw-w-full tw-inline-flex tw-items-center tw-justify-between tw-space-x-3">
      {isStorm && (
        <button
          disabled={!havePreviousPart}
          className={`${
            havePreviousPart
              ? "tw-text-primary-400 tw-border-primary-400 hover:tw-bg-primary-400 hover:tw-text-white"
              : "tw-text-iron-700 tw-border-iron-700 tw-cursor-default"
          } tw-bg-transparent tw-h-6 tw-w-auto tw-min-w-6 tw-text-xs tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out`}
          onClick={(e) => {
            e.stopPropagation();
            setActivePartIndex(activePartIndex - 1);
          }}
        >
          <svg
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 -tw-ml-0.5"
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
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          {activePartIndex > 0 && <span>{activePartIndex +1}</span>}
        </button>
      )}
      <div
        className={`tw-h-full tw-w-full ${
          isStorm ? "tw-min-h-16 tw-flex tw-items-center" : ""
        }`}
        ref={contentRef}
      >
        <div className="tw-group tw-w-full">
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
              onImageLoaded={onImageLoaded}
            />
            {activePart.quoted_drop?.drop_id && (
              <WaveDetailedDropQuote
                dropId={activePart.quoted_drop.drop_id}
                partId={activePart.quoted_drop.drop_part_id}
              />
            )}
          </motion.div>
        </div>
        {!!activePart.media.length && (
          <div
            className={`${
              activePart.content ? "tw-mt-3" : "tw-mt-1"
            } tw-space-y-3`}
          >
            {activePart.media.map((media: any, i: number) => (
              <DropListItemContentMedia
                key={`part-${i}-media-${media.url}`}
                media_mime_type={media.mime_type}
                media_url={media.url}
                onImageLoaded={onImageLoaded}
              />
            ))}
          </div>
        )}
      </div>
      {isStorm && (
        <button
          className={`${
            haveNextPart
              ? "tw-text-primary-400 tw-border-primary-400 hover:tw-bg-primary-400 hover:tw-text-white"
              : "tw-text-iron-700 tw-border-iron-700 tw-cursor-default"
          } tw-bg-transparent tw-h-6 tw-w-auto tw-min-w-6 tw-text-xs tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out`}
          disabled={!haveNextPart}
          onClick={(e) => {
            e.stopPropagation();
            setActivePartIndex(activePartIndex + 1);
          }}
        >
           {haveNextPart && <span>{havePreviousPart ? activePartIndex + 2 : 2}</span>}
          <svg
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 -tw-mr-0.5"
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
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default WaveDetailedDropPartContent;
