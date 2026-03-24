"use client";

import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import InteractiveMediaLoadGate from "@/components/drops/media/InteractiveMediaLoadGate";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";
import { getArweaveGatewayFallbackUrls } from "@/components/nft-image/utils/gateway-fallback";
import { ImageScale } from "@/helpers/image.helpers";
import MediaDisplayAudio from "./MediaDisplayAudio";
import MediaDisplayImage from "./MediaDisplayImage";
import MediaDisplayVideo from "./MediaDisplayVideo";

enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  GLB = "GLB",
  HTML = "HTML",
  UNKNOWN = "UNKNOWN",
}

const MediaDisplayGLB = dynamic(() => import("./MediaDisplayGLB"), {
  ssr: false,
});

const DEFAULT_HTML_MEDIA_TITLE = "Interactive HTML media";
const IFRAME_FALLBACK_TIMEOUT_MS = 8000;

function InteractiveHtmlMediaDisplay({
  media_url,
  previewImageUrl,
  imageScale = ImageScale.AUTOx1080,
  requireInteractionToLoad = false,
}: {
  readonly media_url: string;
  readonly previewImageUrl?: string | null | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly requireInteractionToLoad?: boolean | undefined;
}) {
  const [isActivated, setIsActivated] = useState(!requireInteractionToLoad);
  const urls = useMemo(
    () => getArweaveGatewayFallbackUrls(media_url),
    [media_url]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [didLoadCurrentUrl, setDidLoadCurrentUrl] = useState(false);
  const activeUrl = urls[activeIndex];

  useEffect(() => {
    setIsActivated(!requireInteractionToLoad);
  }, [media_url, requireInteractionToLoad]);

  useEffect(() => {
    if (urls.length === 0) {
      setActiveIndex(0);
      setDidLoadCurrentUrl(false);
      return;
    }

    setActiveIndex(0);
    setDidLoadCurrentUrl(false);
  }, [urls]);

  useEffect(() => {
    setDidLoadCurrentUrl(false);
  }, [activeUrl]);

  useEffect(() => {
    if (!activeUrl || didLoadCurrentUrl || activeIndex + 1 >= urls.length) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setActiveIndex((current) =>
        current === activeIndex && current + 1 < urls.length
          ? current + 1
          : current
      );
    }, IFRAME_FALLBACK_TIMEOUT_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [activeIndex, activeUrl, didLoadCurrentUrl, urls.length]);

  const advanceToNextUrl = () => {
    setActiveIndex((current) =>
      current + 1 < urls.length ? current + 1 : current
    );
  };

  if (requireInteractionToLoad && !isActivated) {
    return (
      <InteractiveMediaLoadGate onLoad={() => setIsActivated(true)}>
        {previewImageUrl ? (
          <MediaDisplayImage src={previewImageUrl} imageScale={imageScale} />
        ) : null}
      </InteractiveMediaLoadGate>
    );
  }

  if (!activeUrl) {
    return null;
  }

  return (
    <SandboxedExternalIframe
      key={activeUrl}
      title={DEFAULT_HTML_MEDIA_TITLE}
      src={activeUrl}
      className="tw-h-full tw-w-full"
      onLoad={() => {
        setDidLoadCurrentUrl(true);
      }}
      onError={advanceToNextUrl}
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

  if (mediaType === MediaType.HTML) {
    return (
      <InteractiveHtmlMediaDisplay
        key={`${media_mime_type}:${media_url}`}
        media_url={media_url}
        previewImageUrl={previewImageUrl}
        imageScale={imageScale}
        requireInteractionToLoad={requireInteractionToLoad}
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
    case MediaType.UNKNOWN:
      return <></>;
    default:
      assertUnreachable(mediaType);
      return;
  }
}
