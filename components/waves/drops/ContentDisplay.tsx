import type { ProcessedContent } from "./media-utils";
import ContentSegmentComponent from "./ContentSegmentComponent";
import MediaThumbnail from "./MediaThumbnail";

interface ContentDisplayProps {
  readonly content: ProcessedContent;
  readonly onClick?: () => void;
  readonly className?: string | undefined;
  readonly textClassName?: string | undefined;
  readonly shouldClamp?: boolean;
  readonly linkify?: boolean;
}

/**
 * Component to display processed content with text segments and media
 */
export default function ContentDisplay({
  content,
  onClick,
  className,
  textClassName,
  shouldClamp = true,
  linkify = true,
}: ContentDisplayProps) {
  const clampClass = shouldClamp ? "tw-line-clamp-1" : "";
  const containerClasses = [
    "tw-text-iron-400 tw-font-normal tw-text-sm tw-flex tw-items-center tw-gap-1.5",
    onClick
      ? "tw-cursor-pointer hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
      : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const textClasses = [clampClass, textClassName ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={containerClasses} onClick={onClick}>
      <span className={textClasses}>
        {/* Render segments in their original order */}
        {content.segments.map((segment, i) => (
          <ContentSegmentComponent
            key={`segment-${i}`}
            segment={segment}
            index={i}
            linkify={linkify}
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
