import type { ProcessedContent } from "./media-utils";
import ContentSegmentComponent from "./ContentSegmentComponent";
import MediaThumbnail from "./MediaThumbnail";

interface ContentDisplayProps {
  readonly content: ProcessedContent;
  readonly onClick?: () => void;
  readonly className?: string | undefined;
  readonly textClassName?: string | undefined;
}

/**
 * Component to display processed content with text segments and media
 */
export default function ContentDisplay({
  content,
  onClick,
  className,
  textClassName,
}: ContentDisplayProps) {
  const containerClasses = [
    "tw-break-all tw-text-iron-300 tw-font-normal tw-text-sm tw-flex tw-items-center tw-gap-1.5 tw-line-clamp-1",
    onClick
      ? "tw-cursor-pointer hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
      : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={containerClasses} onClick={onClick}>
      <span className={`tw-line-clamp-1 ${textClassName ?? ""}`}>
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
