"use client";

import dynamic from "next/dynamic";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import DropListItemContentMediaAudio from "./DropListItemContentMediaAudio";
import { ImageScale } from "@/helpers/image.helpers";

import DropListItemContentMediaImage from "./DropListItemContentMediaImage";
import DropListItemContentMediaVideo from "./DropListItemContentMediaVideo";
import MediaDisplay from "./MediaDisplay";

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

const IMAGE_URL_PATTERN =
  /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)(?:$|[?#])/i;
const VIDEO_URL_PATTERN = /\.(m3u8|m4v|mov|mp4|mpeg|mpg|ogv|webm)(?:$|[?#])/i;
const AUDIO_URL_PATTERN = /\.(aac|flac|m4a|mp3|oga|ogg|wav)(?:$|[?#])/i;
const HTML_URL_PATTERN = /\.(html?)(?:$|[?#])/i;
const GLB_URL_PATTERN = /\.(glb|gltf)(?:$|[?#])/i;

const resolveMediaTypeFromUrl = (mediaUrl: string): MediaType => {
  if (IMAGE_URL_PATTERN.test(mediaUrl)) {
    return MediaType.IMAGE;
  }

  if (VIDEO_URL_PATTERN.test(mediaUrl)) {
    return MediaType.VIDEO;
  }

  if (AUDIO_URL_PATTERN.test(mediaUrl)) {
    return MediaType.AUDIO;
  }

  if (GLB_URL_PATTERN.test(mediaUrl)) {
    return MediaType.GLB;
  }

  if (HTML_URL_PATTERN.test(mediaUrl)) {
    return MediaType.HTML;
  }

  return MediaType.UNKNOWN;
};

const UnavailableMediaFallback = () => (
  <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-black/20 tw-text-sm tw-text-iron-500">
    Preview unavailable
  </div>
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
  htmlIframeContainerClassName,
  htmlPreviewImageUrl,
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly onContainerClick?: (() => void) | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly disableAutoPlay?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly htmlIframeContainerClassName?: string | undefined;
  readonly htmlPreviewImageUrl?: string | undefined;
}) {
  const getMediaType = (): MediaType => {
    const normalizedMimeType = media_mime_type.trim().toLowerCase();

    if (normalizedMimeType.includes("image")) {
      return MediaType.IMAGE;
    }
    if (normalizedMimeType.includes("video")) {
      return MediaType.VIDEO;
    }
    if (normalizedMimeType.includes("audio")) {
      return MediaType.AUDIO;
    }
    if (
      normalizedMimeType === "model/gltf-binary" ||
      normalizedMimeType === "model/gltf+json"
    ) {
      return MediaType.GLB;
    }
    if (normalizedMimeType === "text/html") {
      return MediaType.HTML;
    }

    return resolveMediaTypeFromUrl(media_url);
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
        />
      );
    case MediaType.UNKNOWN:
      return <UnavailableMediaFallback />;
    default:
      return assertUnreachable(mediaType);
  }
}
