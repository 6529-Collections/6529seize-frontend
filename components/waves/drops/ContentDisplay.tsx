import React from "react";
import { ProcessedContent } from "./media-utils";
import ContentSegmentComponent from "./ContentSegmentComponent";
import MediaThumbnail from "./MediaThumbnail";

interface ContentDisplayProps {
  readonly content: ProcessedContent;
  readonly onReplyClick: (serialNo: number) => void;
  readonly serialNo?: number;
}

/**
 * Component to display processed content with text segments and media
 */
export default function ContentDisplay({
  content,
  onReplyClick,
  serialNo,
}: ContentDisplayProps) {
  const handleClick = () => {
    if (serialNo) {
      onReplyClick(serialNo);
    }
  };

  return (
    <span
      className="tw-break-all tw-text-iron-300 tw-font-normal tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-flex tw-items-center tw-flex-wrap tw-gap-1 tw-line-clamp-2 lg:tw-line-clamp-1"
      onClick={handleClick}
    >
      <span className="tw-line-clamp-2 lg:tw-line-clamp-1">
        {/* Render segments in their original order */}
        {content.segments.map((segment, i) => (
          <ContentSegmentComponent
            key={`segment-${i}`}
            segment={segment}
            index={i}
          />
        ))}
      </span>

      {/* Render API media at the end */}
      {content.apiMedia.map((media, i) => (
        <MediaThumbnail key={`api-media-${i}`} media={media} />
      ))}
    </span>
  );
}
