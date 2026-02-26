"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";
import InteractiveIcon from "@/components/drops/media/InteractiveIcon";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { ImageScale } from "@/helpers/image.helpers";

import DropListItemContentMediaAudio from "./DropListItemContentMediaAudio";
import DropListItemContentMediaImage from "./DropListItemContentMediaImage";
import DropListItemContentMediaVideo from "./DropListItemContentMediaVideo";

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
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly onContainerClick?: (() => void) | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly disableAutoPlay?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
}) {
  const [htmlActivated, setHtmlActivated] = useState(!disableAutoPlay);

  useEffect(() => {
    setHtmlActivated(!disableAutoPlay);
  }, [disableAutoPlay, media_url, media_mime_type]);

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
      if (disableAutoPlay && !htmlActivated) {
        return (
          <div className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-950/30">
            <button
              type="button"
              onClick={() => setHtmlActivated(true)}
              className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-transparent"
              aria-label="Load interactive media"
            >
              <span className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border tw-border-white/20 tw-bg-iron-950/90 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-shadow-[0_16px_40px_rgba(0,0,0,0.65)] tw-ring-1 tw-ring-white/10 tw-transition hover:tw-bg-iron-900">
                <InteractiveIcon className="tw-size-4 tw-flex-shrink-0" />
                Tap to load
              </span>
            </button>
          </div>
        );
      }

      return (
        <SandboxedExternalIframe
          title=""
          src={media_url.replace("ipfs://", "https://ipfs.io/ipfs/")}
          className="tw-h-full tw-w-full"
        />
      );
    case MediaType.UNKNOWN:
      return <></>;
    default:
      assertUnreachable(mediaType);
      return;
  }
}
