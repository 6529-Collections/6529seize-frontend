import { DropImagePreview } from "@/components/drops/view/item/content/media/DropImagePreview";
import { isUploadedDropGif } from "@/helpers/gif-preview.helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";
import type { MediaItem } from "./media-utils";

interface MediaThumbnailProps {
  readonly media: MediaItem;
}

/**
 * Component to display a thumbnail of an image or video
 */
export default function MediaThumbnail({ media }: MediaThumbnailProps) {
  const imageClassName =
    "tw-inline tw-flex-shrink-0 tw-h-4 tw-w-4 tw-object-cover tw-rounded";
  if (media.type === "image" && isUploadedDropGif(media.url)) {
    return (
      <DropImagePreview
        originalSrc={media.url}
        imageScale={ImageScale.W_AUTO_H_50}
        alt={media.alt}
        width={16}
        height={16}
        loading="lazy"
        decoding="async"
        className={imageClassName}
        fallback={null}
      />
    );
  }
  return media.type === "image" ? (
    <Image
      src={getScaledImageUri(media.url, ImageScale.W_AUTO_H_50)}
      alt={media.alt}
      width={16}
      height={16}
      loading="lazy"
      decoding="async"
      unoptimized
      className={imageClassName}
    />
  ) : (
    <span
      className="tw-inline-flex tw-h-4 tw-w-auto tw-items-center tw-justify-center tw-rounded tw-bg-iron-800 tw-px-1 tw-text-xs tw-text-iron-400"
      title={media.alt}
    >
      ▶
    </span>
  );
}
