import MediaThumbnail from "./MediaThumbnail";

import type { ContentSegment } from "./media-utils";

interface ContentSegmentComponentProps {
  readonly segment: ContentSegment;
  readonly index: number;
  readonly linkify?: boolean;
}

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/g;
function linkifyText(text: string, segmentIndex: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  const regex = new RegExp(URL_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`${segmentIndex}-text-${partIndex++}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }
    parts.push(
      <a
        key={`${segmentIndex}-link-${partIndex++}`}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="tw-text-iron-200/90 tw-underline tw-decoration-white/20 tw-underline-offset-2 tw-transition-colors tw-duration-300 hover:tw-text-iron-50 hover:tw-decoration-white/45"
      >
        {match[0]}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`${segmentIndex}-text-${partIndex}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Component to render a single segment of content (text or media)
 */
export default function ContentSegmentComponent({
  segment,
  index,
  linkify = true,
}: ContentSegmentComponentProps) {
  if (segment.type === "text") {
    return (
      <span key={`segment-${index}`}>
        {linkify ? linkifyText(segment.content, index) : segment.content}
      </span>
    );
  }

  if (segment.mediaInfo) {
    return (
      <MediaThumbnail key={`segment-${index}`} media={segment.mediaInfo} />
    );
  }

  return null;
}
