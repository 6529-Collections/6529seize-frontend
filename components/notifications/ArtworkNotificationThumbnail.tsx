import { useState } from "react";
import Image from "next/image";
import { BellIcon } from "@heroicons/react/24/outline";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import type { INotificationArtistArtwork } from "@/types/feed.types";

export default function ArtworkNotificationThumbnail({
  notification,
}: {
  readonly notification: INotificationArtistArtwork;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const drop = notification.related_drops.find(
    (item) => item.id === notification.additional_context.drop_id
  );
  const image =
    getDropPreviewImageUrl(drop?.metadata) ??
    drop?.parts
      .flatMap((part) => part.media)
      .find((media) => media.mime_type.startsWith("image/"))?.url;
  const src = image ? getScaledImageUri(image, ImageScale.W_AUTO_H_50) : null;

  return (
    <div className="tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
      {src && src !== failedSrc ? (
        <Image
          src={src}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          unoptimized
          className="tw-size-full tw-object-contain"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <BellIcon aria-hidden="true" className="tw-size-5 tw-text-iron-400" />
      )}
    </div>
  );
}
