"use client";

import {
  ExtendedDrop,
  getDropPreviewImageUrl,
} from "@/helpers/waves/drop.helpers";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import WaveDropPartContentMedias from "../drops/WaveDropPartContentMedias";
import WaveDropPartContentMarkdown from "../drops/WaveDropPartContentMarkdown";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";

interface WaveSmallLeaderboardItemContentProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
}

export const WaveSmallLeaderboardItemContent: React.FC<
  WaveSmallLeaderboardItemContentProps
> = ({ drop, onDropClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setShowGradient(contentRef.current.scrollHeight > 208);
    }
  }, [drop]);

  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );

  const isStorm = drop.parts.length > 1;
  const haveMetadata = !!drop.metadata.length;
  const haveMedia = !!drop.parts.filter((part) => !!part.media.length).length;

  return (
    <div>
      <div
        ref={contentRef}
        onClick={onDropClick}
        className="tw-relative tw-max-h-52 tw-cursor-pointer tw-space-y-3 tw-overflow-hidden"
      >
        {previewImageUrl ? (
          <div className="tw-w-full tw-flex tw-justify-center">
            <img
              src={getScaledImageUri(previewImageUrl, ImageScale.AUTOx450)}
              alt="Preview"
              className="tw-max-w-full tw-max-h-48 tw-object-contain tw-rounded-lg"
            />
          </div>
        ) : (
          !!drop.parts[0]?.media.length && (
            <WaveDropPartContentMedias
              activePart={drop.parts[0]}
              disableMediaInteraction={true}
              imageScale={ImageScale.AUTOx450}
            />
          )
        )}
        <WaveDropPartContentMarkdown
          mentionedUsers={drop.mentioned_users}
          referencedNfts={drop.referenced_nfts}
          part={drop.parts[0]!}
          wave={drop.wave}
          onQuoteClick={() => {}}
        />
        {showGradient && (
          <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-z-[1] tw-h-12 tw-bg-gradient-to-t tw-from-iron-900 tw-via-iron-900 tw-to-transparent" />
        )}
      </div>
      <div className="tw-mb-3 tw-mt-3 tw-flex tw-items-center tw-gap-x-2">
        {isStorm && (
          <>
            <svg
              className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              data-tooltip-id={`wave-storm-${drop.id}`}
            >
              <path
                d="M3.75 13.5L14.25 2.25L12 10.5H20.25L9.75 21.75L12 13.5H3.75Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Tooltip
              id={`wave-storm-${drop.id}`}
              place="top"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
                zIndex: 10,
              }}
            >
              <span className="tw-text-xs">Storm</span>
            </Tooltip>
          </>
        )}
        {!!haveMetadata && (
          <>
            <svg
              className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-400"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              data-tooltip-id={`wave-metadata-${drop.id}`}
            >
              <path
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Tooltip
              id={`wave-metadata-${drop.id}`}
              place="top"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
                zIndex: 10,
              }}
            >
              <span className="tw-text-xs">Metadata</span>
            </Tooltip>
          </>
        )}
        {!!haveMedia && (
          <>
            <svg
              className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-400"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              data-tooltip-id={`wave-media-${drop.id}`}
            >
              <path
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Tooltip
              id={`wave-media-${drop.id}`}
              place="top"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
                zIndex: 10,
              }}
            >
              <span className="tw-text-xs">Media</span>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
};
