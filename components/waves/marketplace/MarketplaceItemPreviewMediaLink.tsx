import Image from "next/image";
import type { ReactNode } from "react";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import type { ResolvedPreviewHref } from "./MarketplaceItemPreviewCard.types";
import { MARKETPLACE_MEDIA_FRAME_CLASS } from "./previewLayout";

interface MarketplaceItemPreviewMediaLinkProps {
  readonly mediaUrl: string;
  readonly mediaMimeType: string;
  readonly resolvedPreviewHref: ResolvedPreviewHref;
}

const isImageMimeType = (mimeType: string): boolean =>
  mimeType.toLowerCase().includes("image");

const isVideoMimeType = (mimeType: string): boolean =>
  mimeType.toLowerCase().includes("video");

const isGammaioHref = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    return hostname === "gamma.io" || hostname === "www.gamma.io";
  } catch {
    return false;
  }
};

export default function MarketplaceItemPreviewMediaLink({
  mediaUrl,
  mediaMimeType,
  resolvedPreviewHref,
}: MarketplaceItemPreviewMediaLinkProps) {
  const href = resolvedPreviewHref.href;
  const isImage = isImageMimeType(mediaMimeType);
  const isVideo = isVideoMimeType(mediaMimeType);
  const useDirectImageRendering = isImage && isGammaioHref(href);
  const mediaFrameClassName = useDirectImageRendering
    ? "tw-box-border tw-w-full tw-bg-inherit tw-p-4 md:tw-p-6"
    : MARKETPLACE_MEDIA_FRAME_CLASS;
  let mediaContent: ReactNode;

  if (useDirectImageRendering) {
    // Gamma media can resolve through several hosts, so this direct preview skips optimization.
    mediaContent = (
      <Image
        src={mediaUrl}
        alt="Marketplace item media"
        width={320}
        height={320}
        unoptimized
        className="tw-block tw-h-auto tw-max-h-72 tw-min-h-[12.5rem] tw-w-auto tw-min-w-[12.5rem] tw-max-w-full tw-object-contain"
        style={{ imageRendering: "pixelated" }}
        data-testid="media-display"
        data-mime={mediaMimeType}
        data-url={mediaUrl}
        data-disable="true"
      />
    );
  } else if (isVideo) {
    mediaContent = (
      <SeizeVideoPlayer
        src={mediaUrl}
        template="card-preview"
        className="tw-h-full tw-w-full"
        autoPlay
        layout="fill"
        showActions={false}
        data-testid="media-display"
        data-mime={mediaMimeType}
        data-url={mediaUrl}
        data-disable="true"
      />
    );
  } else {
    mediaContent = (
      <MediaDisplay
        media_mime_type={mediaMimeType}
        media_url={mediaUrl}
        disableMediaInteraction={true}
      />
    );
  }

  return (
    <div
      className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden"
      data-testid="marketplace-item-media-link"
    >
      <div
        className={`${mediaFrameClassName} tw-relative tw-flex tw-items-center tw-justify-center tw-overflow-hidden`}
        data-testid="manifold-item-media"
      >
        {mediaContent}
      </div>
    </div>
  );
}
