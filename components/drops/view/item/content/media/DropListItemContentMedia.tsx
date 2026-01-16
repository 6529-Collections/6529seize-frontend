"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import DropListItemContentMediaAudio from "./DropListItemContentMediaAudio";
import { ImageScale } from "@/helpers/image.helpers";

import DropListItemContentMediaImage from "./DropListItemContentMediaImage";
import DropListItemContentMediaVideo from "./DropListItemContentMediaVideo";
import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";

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
  }, [disableAutoPlay, media_url]);

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
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-950/30">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setHtmlActivated(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setHtmlActivated(true);
                }
              }}
              className="tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900/80 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-200 tw-transition hover:tw-bg-iron-800"
            >
              Tap to load
            </div>
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
