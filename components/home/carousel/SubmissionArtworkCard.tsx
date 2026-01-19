"use client";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { ImageScale } from "@/helpers/image.helpers";
import {
  getDropPreviewImageUrl,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { useMemo } from "react";

interface SubmissionArtworkCardProps {
  readonly drop: ExtendedDrop;
  readonly isActive?: boolean;
  readonly imageScale?: ImageScale;
  readonly renderMode?: "full" | "preview" | "placeholder";
}

export default function SubmissionArtworkCard({
  drop,
  isActive = true,
  imageScale = ImageScale.AUTOx600,
  renderMode = "full",
}: SubmissionArtworkCardProps) {
  const media = drop.parts[0]?.media[0];

  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );

  if (!media) {
    return null;
  }

  const isImage = media.mime_type?.includes("image");
  const canRenderPreview = !!previewImageUrl || isImage;
  const shouldRenderPlaceholder =
    renderMode === "placeholder" || (renderMode === "preview" && !canRenderPreview);

  const mediaWrapperClasses = `tw-h-full tw-w-full ${
    isActive
      ? "tw-shadow-[0_8px_32px_rgba(255,255,255,0.08)]"
      : "tw-pointer-events-none"
  }`;

  return (
    <div className="tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-bg-black">
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-mt-2 tw-rounded-lg tw-shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] tw-ring-1 tw-ring-inset tw-ring-white/[0.15]" />
      <div
        className={mediaWrapperClasses}
        onClick={isActive ? (event) => event.stopPropagation() : undefined}
      >
        {shouldRenderPlaceholder ? (
          <div className="tw-h-full tw-w-full tw-rounded-lg tw-bg-iron-950" />
        ) : (
          <MediaDisplay
            media_mime_type={media.mime_type ?? "image/jpeg"}
            media_url={media.url ?? ""}
            disableMediaInteraction={true}
            imageScale={imageScale}
            previewImageUrl={previewImageUrl}
          />
        )}
      </div>
    </div>
  );
}
