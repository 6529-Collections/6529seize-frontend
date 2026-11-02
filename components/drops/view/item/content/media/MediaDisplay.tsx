"use client";

import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import InteractiveMediaLoadGate from "@/components/drops/media/InteractiveMediaLoadGate";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";
import {
  getMediaGatewayFallbackUrls,
  shouldUseIframeFallbackTimeout,
} from "@/components/nft-image/utils/gateway-fallback";
import { ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import MediaDisplayAudio from "./MediaDisplayAudio";
import MediaDisplayImage from "./MediaDisplayImage";
import MediaDisplayVideo from "./MediaDisplayVideo";
import { InlineMediaActions } from "./MediaActionToolbar";
import type { MediaLoadStrategy } from "./mediaLoadStrategy";
import type { GifPreviewLoadingLayout } from "./GifPreviewLoadingIndicator";
import UnsupportedMediaLink from "./UnsupportedMediaLink";

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

const IFRAME_FALLBACK_TIMEOUT_MS = 8000;

/**
 * Large HTML pieces can take several seconds to load inside the sandboxed
 * iframe. Keep a visible status over the frame until it loads so the empty
 * frame is not mistaken for broken media.
 */
function InteractiveHtmlLoadingStatus({ label }: { readonly label: string }) {
  return (
    <output className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-p-4">
      <span className="tw-inline-flex tw-max-w-full tw-items-center tw-gap-2 tw-rounded-full tw-bg-iron-950/90 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-shadow-[0_16px_40px_rgba(0,0,0,0.65)] tw-ring-1 tw-ring-white/10">
        <span
          aria-hidden="true"
          className="tw-block tw-size-4 tw-shrink-0 tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-100/30 tw-border-t-iron-100 motion-safe:tw-animate-spin"
        />
        <span className="tw-min-w-0">{label}</span>
      </span>
    </output>
  );
}

function InteractiveHtmlMediaDisplay({
  media_url,
  previewImageUrl,
  imageScale = ImageScale.AUTOx1080,
  requireInteractionToLoad = false,
  iframeContainerClassName,
}: {
  readonly media_url: string;
  readonly previewImageUrl?: string | null | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly requireInteractionToLoad?: boolean | undefined;
  readonly iframeContainerClassName?: string | undefined;
}) {
  const { isCapacitor } = useCapacitor();
  const locale = useBrowserLocale();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isActivated, setIsActivated] = useState(!requireInteractionToLoad);
  const urls = useMemo(
    () => getMediaGatewayFallbackUrls(media_url),
    [media_url]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [didLoadCurrentUrl, setDidLoadCurrentUrl] = useState(false);
  const [isIframeVisible, setIsIframeVisible] = useState(false);
  const activeUrl = urls[activeIndex];

  useEffect(() => {
    setIsActivated(!requireInteractionToLoad);
  }, [media_url, requireInteractionToLoad]);

  useEffect(() => {
    setActiveIndex(0);
    setDidLoadCurrentUrl(false);
    setIsIframeVisible(false);
  }, [urls]);

  useEffect(() => {
    setDidLoadCurrentUrl(false);
  }, [activeUrl]);

  useEffect(() => {
    if (
      !activeUrl ||
      !isIframeVisible ||
      didLoadCurrentUrl ||
      activeIndex + 1 >= urls.length ||
      !shouldUseIframeFallbackTimeout(activeUrl)
    ) {
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
  }, [activeIndex, activeUrl, didLoadCurrentUrl, isIframeVisible, urls.length]);

  const advanceToNextUrl = () => {
    setActiveIndex((current) =>
      current + 1 < urls.length ? current + 1 : current
    );
  };

  const handleFullScreen = useCallback(() => {
    iframeRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

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
    <div className="tw-relative tw-h-full tw-w-full">
      <InlineMediaActions
        variant="html"
        isDownloading={false}
        onFullscreen={handleFullScreen}
        fullscreenTargetAvailable={!isCapacitor}
        position="bottom-right"
      />
      <SandboxedExternalIframe
        key={activeUrl}
        title={t(locale, "media.interactive.frameTitle")}
        src={activeUrl}
        className="tw-h-full tw-w-full"
        containerClassName={iframeContainerClassName}
        iframeRef={iframeRef}
        onLoad={() => {
          setDidLoadCurrentUrl(true);
        }}
        onError={advanceToNextUrl}
        onVisible={() => {
          setIsIframeVisible(true);
        }}
      />
      {didLoadCurrentUrl ? null : (
        <InteractiveHtmlLoadingStatus
          label={t(locale, "media.interactive.loading")}
        />
      )}
    </div>
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
  isInertPreview = false,
  imageScale = ImageScale.AUTOx1080,
  previewImageUrl,
  requireInteractionToLoad = false,
  iframeContainerClassName,
  fillVideoContainer = false,
  loadStrategy = "in-view",
  imageLoadingLayout = "inline",
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly disableMediaInteraction?: boolean | undefined;
  readonly isInertPreview?: boolean | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly previewImageUrl?: string | null | undefined;
  readonly requireInteractionToLoad?: boolean | undefined;
  readonly iframeContainerClassName?: string | undefined;
  readonly fillVideoContainer?: boolean | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
  readonly imageLoadingLayout?: GifPreviewLoadingLayout | undefined;
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
    // `loadStrategy` only controls how a static preview image loads. HTML
    // media always uses the interactive renderer below, so eager surfaces
    // such as quick vote still mount the iframe or the tap-to-load gate.
    if (previewImageUrl && !requireInteractionToLoad) {
      return (
        <MediaDisplayImage
          src={previewImageUrl}
          imageScale={imageScale}
          loadStrategy={loadStrategy}
        />
      );
    }

    return (
      <InteractiveHtmlMediaDisplay
        key={`${media_mime_type}:${media_url}`}
        media_url={media_url}
        previewImageUrl={previewImageUrl}
        imageScale={imageScale}
        requireInteractionToLoad={requireInteractionToLoad}
        iframeContainerClassName={iframeContainerClassName}
      />
    );
  }

  if (previewImageUrl && mediaType !== MediaType.IMAGE) {
    return (
      <MediaDisplayImage
        src={previewImageUrl}
        imageScale={imageScale}
        loadStrategy={loadStrategy}
      />
    );
  }

  switch (mediaType) {
    case MediaType.IMAGE:
      return (
        <MediaDisplayImage
          src={media_url}
          imageLoadingLayout={imageLoadingLayout}
          imageScale={imageScale}
          loadStrategy={loadStrategy}
        />
      );
    case MediaType.VIDEO:
      return (
        <MediaDisplayVideo
          src={media_url}
          mimeType={media_mime_type}
          showControls={!disableMediaInteraction}
          isInertPreview={isInertPreview}
          fillContainer={fillVideoContainer}
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
      return (
        <UnsupportedMediaLink
          media_url={media_url}
          disableMediaInteraction={disableMediaInteraction}
        />
      );
    default:
      assertUnreachable(mediaType);
      return;
  }
}
