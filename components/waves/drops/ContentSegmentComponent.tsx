import type { ContentSegment } from "./media-utils";
import MediaThumbnail from "./MediaThumbnail";

interface ContentSegmentComponentProps {
  readonly segment: ContentSegment;
  readonly index: number;
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
        className="tw-text-primary-300 hover:tw-text-primary-400 tw-transition tw-duration-300"
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
}: ContentSegmentComponentProps) {
  if (segment.type === "text") {
    return <span key={`segment-${index}`}>{linkifyText(segment.content, index)}</span>;
  }

  if (segment.mediaInfo) {
    return (
      <MediaThumbnail key={`segment-${index}`} media={segment.mediaInfo} />
    );
  }

  return null;
}
