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
import { useOptionalDropContext } from "@/components/waves/drops/DropContext";

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
  isCompetitionDrop = false,
  disableModal = false,
  disableAutoPlay = false,
  fillVideoContainer = false,
  imageObjectPosition,
  imageScale = ImageScale.AUTOx800,
  htmlIframeContainerClassName,
  htmlPreviewImageUrl,
  loadStrategy = "in-view",
  galleryItemId,
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly disableAutoPlay?: boolean | undefined;
  readonly fillVideoContainer?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly htmlIframeContainerClassName?: string | undefined;
  readonly htmlPreviewImageUrl?: string | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
  readonly galleryItemId?: string | undefined;
}) {
  const dropContext = useOptionalDropContext();
  const showVideoFullscreen = dropContext?.showVideoFullscreen ?? true;

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
          isCompetitionDrop={isCompetitionDrop}
          disableModal={disableModal}
          imageObjectPosition={imageObjectPosition}
          imageScale={imageScale}
          loadStrategy={loadStrategy}
          galleryItemId={galleryItemId}
        />
      );
    case MediaType.VIDEO:
      return (
        <DropListItemContentMediaVideo
          src={media_url}
          mimeType={media_mime_type}
          disableAutoPlay={disableAutoPlay}
          fillContainer={fillVideoContainer}
          showFullscreen={showVideoFullscreen}
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
