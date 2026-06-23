"use client";

import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";
import type { ReactNode } from "react";

export type DropPartMarkdownImageLayout = "standalone" | "grouped";

interface DropPartMarkdownImageProps {
  readonly src: string;
  readonly layout?: DropPartMarkdownImageLayout | undefined;
  readonly galleryItemId?: string | undefined;
}

export default function DropPartMarkdownImage({
  src,
  layout = "standalone",
  galleryItemId,
}: DropPartMarkdownImageProps) {
  const wrapperClassName =
    layout === "grouped"
      ? "tw-relative tw-min-w-0 tw-w-full"
      : "tw-relative tw-mt-2 tw-w-full";

  return (
    <div className={wrapperClassName}>
      <DropListItemContentMediaImage
        src={src}
        loadStrategy="eager"
        intrinsicHeight
        galleryItemId={galleryItemId}
      />
    </div>
  );
}

export function DropPartMarkdownImageGroup({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-mt-2 tw-grid tw-w-full tw-grid-cols-1 tw-items-start tw-justify-start tw-gap-2 sm:tw-grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),16rem))]">
      {children}
    </div>
  );
}
