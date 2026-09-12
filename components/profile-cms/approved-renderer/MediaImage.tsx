import Image from "next/image";

import type { getApprovedMedia } from "./media";

export default function ApprovedMediaImage({
  media,
  className,
}: {
  readonly media: NonNullable<ReturnType<typeof getApprovedMedia>>;
  readonly className?: string | undefined;
}) {
  return (
    <Image
      src={media.src}
      alt={media.item.alt}
      width={media.item.width ?? 1200}
      height={media.item.height ?? 900}
      className={className}
      data-pixel={media.pixelArt || undefined}
      loading="lazy"
      unoptimized
    />
  );
}
