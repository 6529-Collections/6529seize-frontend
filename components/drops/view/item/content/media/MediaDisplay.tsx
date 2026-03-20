"use client";

import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import InteractiveMediaLoadGate from "@/components/drops/media/InteractiveMediaLoadGate";
import { parseIpfsUrl } from "@/helpers/Helpers";
import dynamic from "next/dynamic";
import { useState } from "react";

import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";
import { ImageScale } from "@/helpers/image.helpers";
import MediaDisplayAudio from "./MediaDisplayAudio";
import DropMediaAttachmentCard from "./DropMediaAttachmentCard";
import MediaDisplayImage from "./MediaDisplayImage";
import MediaDisplayVideo from "./MediaDisplayVideo";

enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  GLB = "GLB",
  HTML = "HTML",
  CSV = "CSV",
  UNKNOWN = "UNKNOWN",
}

const MediaDisplayGLB = dynamic(() => import("./MediaDisplayGLB"), {
  ssr: false,
});

const DEFAULT_HTML_MEDIA_TITLE = "Interactive HTML media";

const normalizeMediaUrl = (mediaUrl: string): string => parseIpfsUrl(mediaUrl);

function InteractiveHtmlMediaDisplay({
  media_url,
  previewImageUrl,
  imageScale = ImageScale.AUTOx1080,
}: {
  readonly media_url: string;
  readonly previewImageUrl?: string | null | undefined;
  readonly imageScale?: ImageScale | undefined;
}) {
  const [isActivated, setIsActivated] = useState(false);
  const normalizedMediaUrl = normalizeMediaUrl(media_url);

  if (!isActivated) {
    return (
      <InteractiveMediaLoadGate onLoad={() => setIsActivated(true)}>
        {previewImageUrl ? (
          <MediaDisplayImage src={previewImageUrl} imageScale={imageScale} />
        ) : null}
      </InteractiveMediaLoadGate>
    );
  }

  return (
    <SandboxedExternalIframe
      title={DEFAULT_HTML_MEDIA_TITLE}
      src={normalizedMediaUrl}
      className="tw-h-full tw-w-full"
    />
  );
}

/**
 * A component to display media content without interactive modal functionality.
 * Identical to DropListItemContentMedia but without art viewing modal functionality.
 * Use this when you want to simply display media in a container that has its own click behavior.
 *
 * When previewImageUrl is provided, it will be shown instead of the original media
 * for non-image media types (video, audio, HTML, GLB). This is useful for showing
 * static preview images in gallery/thumbnail contexts.
 *
 * When requireInteractionToLoad is true for HTML media, previewImageUrl becomes
 * the poster shown behind the load gate instead of permanently replacing the HTML.
 */
export default function MediaDisplay({
  media_mime_type,
  media_url,
  disableMediaInteraction = false,
  imageScale = ImageScale.AUTOx1080,
  previewImageUrl,
  requireInteractionToLoad = false,
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly disableMediaInteraction?: boolean | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly previewImageUrl?: string | null | undefined;
  readonly requireInteractionToLoad?: boolean | undefined;
}) {
  const normalizedMediaUrl = normalizeMediaUrl(media_url);
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
    if (media_mime_type === "text/csv") {
      return MediaType.CSV;
    }
    return MediaType.UNKNOWN;
  };

  const mediaType = getMediaType();

  if (mediaType === MediaType.HTML && requireInteractionToLoad) {
    return (
      <InteractiveHtmlMediaDisplay
        key={`${media_mime_type}:${media_url}`}
        media_url={media_url}
        previewImageUrl={previewImageUrl}
        imageScale={imageScale}
      />
    );
  }

  if (previewImageUrl && mediaType !== MediaType.IMAGE) {
    return <MediaDisplayImage src={previewImageUrl} imageScale={imageScale} />;
  }

  switch (mediaType) {
    case MediaType.IMAGE:
      return <MediaDisplayImage src={media_url} imageScale={imageScale} />;
    case MediaType.VIDEO:
      return (
        <MediaDisplayVideo
          src={media_url}
          showControls={!disableMediaInteraction}
          disableClickHandler={disableMediaInteraction}
        />
      );
    case MediaType.AUDIO:
      return (
        <MediaDisplayAudio
          src={media_url}
          showControls={!disableMediaInteraction}
        />
      );
    case MediaType.GLB:
      return (
        <MediaDisplayGLB
          src={media_url}
          disableMediaInteractions={disableMediaInteraction}
        />
      );
    case MediaType.HTML:
      return (
        <SandboxedExternalIframe
          title={DEFAULT_HTML_MEDIA_TITLE}
          src={normalizedMediaUrl}
          className="tw-h-full tw-w-full"
        />
      );
    case MediaType.CSV:
      return (
        <DropMediaAttachmentCard
          src={media_url}
          mimeType={media_mime_type}
        />
      );
    case MediaType.UNKNOWN:
      return <></>;
    default:
      assertUnreachable(mediaType);
      return;
  }
}
