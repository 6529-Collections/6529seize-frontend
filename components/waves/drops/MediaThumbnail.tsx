import type { MediaItem } from "./media-utils";

interface MediaThumbnailProps {
  readonly media: MediaItem;
}

/**
 * Component to display a thumbnail of an image or video
 */
export default function MediaThumbnail({ media }: MediaThumbnailProps) {
  return media.type === "image" ? (
    <img
      src={media.url}
      alt={media.alt}
      className="tw-inline tw-h-4 tw-w-4 tw-object-cover tw-rounded"
    />
  ) : (
    <span
      className="tw-inline-flex tw-items-center tw-justify-center tw-h-4 tw-w-auto tw-px-1 tw-bg-iron-800 tw-rounded tw-text-xs tw-text-iron-400"
      title={media.alt}
    >
      ▶
    </span>
  );
}
