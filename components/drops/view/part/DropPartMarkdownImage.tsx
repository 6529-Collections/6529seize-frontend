"use client";

import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";

interface DropPartMarkdownImageProps {
  readonly src: string;
}

export default function DropPartMarkdownImage({
  src,
}: DropPartMarkdownImageProps) {
  return (
    <div className="tw-relative tw-mt-2 tw-w-full">
      <DropListItemContentMediaImage
        src={src}
        loadStrategy="eager"
        intrinsicHeight
      />
    </div>
  );
}
