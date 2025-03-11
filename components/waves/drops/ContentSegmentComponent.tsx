import React from "react";
import { ContentSegment } from "./media-utils";
import MediaThumbnail from "./MediaThumbnail";

interface ContentSegmentComponentProps {
  readonly segment: ContentSegment;
  readonly index: number;
}

/**
 * Component to render a single segment of content (text or media)
 */
export default function ContentSegmentComponent({ 
  segment, 
  index 
}: ContentSegmentComponentProps) {
  if (segment.type === "text") {
    return <span key={`segment-${index}`}>{segment.content}</span>;
  }
  
  if (segment.mediaInfo) {
    return (
      <MediaThumbnail 
        key={`segment-${index}`} 
        media={segment.mediaInfo} 
      />
    );
  }
  
  return null;
}