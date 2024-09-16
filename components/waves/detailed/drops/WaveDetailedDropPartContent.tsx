import React, { useEffect, useState } from "react";
import DropPartMarkdown from "../../../drops/view/part/DropPartMarkdown";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import { Drop } from "../../../../generated/models/Drop";
import { DropPart } from "../../../../generated/models/DropPart";
import WaveDetailedDropFollowAuthor from "./WaveDetailedDropFollowAuthor";
import UserCICAndLevel from "../../../user/utils/UserCICAndLevel";

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
              ? "tw-text-iron-300"
              : "tw-text-iron-700 tw-cursor-default"
          } tw-bg-iron-950 tw-h-7 tw-w-7 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-650 tw-transition tw-duration-300 tw-ease-out`}
          onClick={(e) => {
            e.stopPropagation();
            setActivePartIndex(activePartIndex - 1);
          }}
        >
          <svg
            className="tw-size-4 tw-flex-shrink-0"
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
            <div className="tw-bg-iron-950 tw-rounded-xl tw-px-4 tw-py-2 tw-mt-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
              <div className="tw-relative tw-group tw-w-full tw-flex tw-flex-col">
                <div className="tw-flex tw-gap-x-2">
                  <div className="tw-h-6 tw-w-6 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-md">
                    <div className="tw-rounded-md tw-h-full tw-w-full">
                      <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-md tw-overflow-hidden tw-bg-iron-900">
                        <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-md tw-overflow-hidden">
                          <img
                            src="#"
                            alt="#"
                            className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tw-mt-1 tw-flex tw-flex-col tw-w-full">
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <div className="tw-flex tw-items-center tw-gap-x-2">
                        {/*  <UserCICAndLevel /> */}

                        <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                          <a
                            href="#"
                            className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
                          >
                            user
                          </a>
                        </p>
                      </div>

                      {/*   <WaveDetailedDropFollowAuthor /> */}

                      <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
                      <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                        5h
                      </p>
                    </div>
                    <div>
                      <a
                        href="#"
                        className="tw-text-[11px] tw-leading-0 -tw-mt-1 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
                      >
                        wave
                      </a>
                    </div>
                    <div className="tw-mt-0.5">
                      <p>Lorem, ipsum.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              ? "tw-text-iron-300"
              : "tw-text-iron-700 tw-cursor-default"
          } tw-bg-iron-950 tw-h-7 tw-w-7 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-650 tw-transition tw-duration-300 tw-ease-out`}
          disabled={!showNextButton}
          onClick={(e) => {
            e.stopPropagation();
            setActivePartIndex(activePartIndex + 1);
          }}
        >
          <svg
            className="tw-size-4 tw-flex-shrink-0"
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
