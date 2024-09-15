import React, { useEffect, useState } from "react";
import DropPartMarkdown from "../../../drops/view/part/DropPartMarkdown";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import { Drop } from "../../../../generated/models/Drop";
import { DropPart } from "../../../../generated/models/DropPart";
import WaveDetailedDropQuote from "./WaveDetailedDropQuote";

interface WaveDetailedDropPartContentProps {
  readonly drop: Drop;
  readonly activePart: DropPart;
  readonly showPrevButton: boolean;
  readonly showNextButton: boolean;
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
  showPrevButton,
  showNextButton,
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
    <div className="tw-w-full tw-flex tw-justify-between tw-space-x-2">
      {showPrevButton && (
        <button
          disabled={!showPrevButton}
          className={`${
            showPrevButton
              ? "tw-text-iron-300 hover:tw-text-primary-400"
              : "tw-text-iron-700 tw-cursor-default"
          } tw-bg-transparent tw-rounded-lg tw-border-0 tw-transition tw-duration-300 tw-ease-out`}
          onClick={(e) => {
            e.stopPropagation();
            setActivePartIndex(activePartIndex - 1);
          }}
        >
          <svg
            className="tw-size-5 tw-flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            aria-hidden="true"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>
      )}
      <div className="tw-h-full tw-w-full" ref={contentRef}>
        <div className="tw-group tw-w-full">
          <DropPartMarkdown
            mentionedUsers={drop.mentioned_users}
            referencedNfts={drop.referenced_nfts}
            partContent={activePart.content}
            onImageLoaded={onImageLoaded}
          />
          {activePart.quoted_drop?.drop_id && (
            <WaveDetailedDropQuote
              dropId={activePart.quoted_drop.drop_id}
              partId={activePart.part_id}
            />
          )}
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
      {showNextButton && (
        <button
          className={`${
            showNextButton
              ? "tw-text-iron-300 hover:tw-text-primary-400"
              : "tw-text-iron-700 tw-cursor-default"
          } tw-bg-transparent tw-rounded-lg tw-border-0 tw-transition tw-duration-300 tw-ease-out`}
          disabled={!showNextButton}
          onClick={(e) => {
            e.stopPropagation();
            setActivePartIndex(activePartIndex + 1);
          }}
        >
          <svg
            className="tw-size-5 tw-flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            aria-hidden="true"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
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
