"use client";

import dynamic from "next/dynamic";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import DropListItemContentMediaAudio from "./DropListItemContentMediaAudio";
import { ImageScale } from "@/helpers/image.helpers";
import type { MediaLoadStrategy } from "./mediaLoadStrategy";

import DropListItemContentMediaImage from "./DropListItemContentMediaImage";
import DropListItemContentMediaVideo from "./DropListItemContentMediaVideo";
import MediaDisplay from "./MediaDisplay";
import UnsupportedMediaLink from "./UnsupportedMediaLink";

enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  GLB = "GLB",
  HTML = "HTML",
  UNKNOWN = "UNKNOWN",
}

const DropListItemContentMediaGLB = dynamic(
  () => import("./DropListItemContentMediaGLB"),
  {
    ssr: false,
  }
);

export default function DropListItemContentMedia({
  media_mime_type,
  media_url,
  onContainerClick,
  isCompetitionDrop = false,
  disableModal = false,
  disableAutoPlay = false,
  imageObjectPosition,
  imageScale = ImageScale.AUTOx800,
  imageSizes,
  useResponsiveImageSrcSet = false,
  htmlIframeContainerClassName,
  htmlPreviewImageUrl,
  loadStrategy = "in-view",
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly onContainerClick?: (() => void) | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly disableAutoPlay?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly imageSizes?: string | undefined;
  readonly useResponsiveImageSrcSet?: boolean | undefined;
  readonly htmlIframeContainerClassName?: string | undefined;
  readonly htmlPreviewImageUrl?: string | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
}) {
  const getMediaType = (): MediaType => {
    if (media_mime_type.includes("image")) {
      return MediaType.IMAGE;
    }
    if (media_mime_type.includes("video")) {
      return MediaType.VIDEO;
    }
    if (media_mime_type.includes("audio")) {
      return MediaType.AUDIO;
    }
    if (
      media_mime_type === "model/gltf-binary" ||
      media_mime_type === "model/gltf+json" ||
      media_url.endsWith(".glb") ||
      media_url.endsWith(".gltf")
    ) {
      return MediaType.GLB;
    }
    if (media_mime_type === "text/html") {
      return MediaType.HTML;
    }
    return MediaType.UNKNOWN;
  };

  const mediaType = getMediaType();

  switch (mediaType) {
    case MediaType.IMAGE:
      return (
        <DropListItemContentMediaImage
          src={media_url}
          onContainerClick={onContainerClick}
          isCompetitionDrop={isCompetitionDrop}
          disableModal={disableModal}
          imageObjectPosition={imageObjectPosition}
          imageScale={imageScale}
          imageSizes={imageSizes}
          useResponsiveImageSrcSet={useResponsiveImageSrcSet}
          loadStrategy={loadStrategy}
        />
      );
    case MediaType.VIDEO:
      return (
        <DropListItemContentMediaVideo
          src={media_url}
          disableAutoPlay={disableAutoPlay}
        />
      );
    case MediaType.AUDIO:
      return <DropListItemContentMediaAudio src={media_url} />;
    case MediaType.GLB:
      return <DropListItemContentMediaGLB src={media_url} />;
    case MediaType.HTML:
      return (
        <MediaDisplay
          media_mime_type={media_mime_type}
          media_url={media_url}
          imageScale={imageScale}
          previewImageUrl={htmlPreviewImageUrl}
          requireInteractionToLoad={disableAutoPlay}
          iframeContainerClassName={htmlIframeContainerClassName}
          loadStrategy={loadStrategy}
        />
      );
    case MediaType.UNKNOWN:
      return <UnsupportedMediaLink media_url={media_url} />;
    default:
      return assertUnreachable(mediaType);
  }
}
