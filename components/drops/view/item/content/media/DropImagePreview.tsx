"use client";

import { useLocalImagePreviewSource } from "./LocalImagePreviewContext";
import { isAllowedOgImageSourceUrl } from "@/app/api/og-metadata/_lib/imageProxyPolicy";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  getAnimatedImagePreviewUri,
  isGifImageUrl,
  getLegacyGifPreviewUri,
} from "@/helpers/gif-preview.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Image, { type ImageProps } from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export function getDropImagePreviewSources(
  src: string,
  scale: ImageScale,
  preferAnimation = false
) {
  const original = resolveIpfsUrlSync(src);
  // An IPFS gateway URL is still an original, even when resolving it changes
  // the URL string. Try bounded CDN copies before the guarded external proxy.
  const previews = [scale, ImageScale.AUTOx450].map((size) =>
    isGifImageUrl(original)
      ? getAnimatedImagePreviewUri(original, size)
      : getScaledImageUri(original, size)
  );
  const ordered = preferAnimation
    ? [...previews, ...previews.map(getLegacyGifPreviewUri)]
    : previews.flatMap((url) => [url, getLegacyGifPreviewUri(url)]);
  const sources = ordered.filter(
    (url, index, all) => url !== original && all.indexOf(url) === index
  );
  if (sources.length || !isAllowedOgImageSourceUrl(original)) return sources;

  // External embeds have no CDN scale path. The existing guarded image proxy
  // returns a bounded image, never source bytes; oversized animations use a still.
  const query = new URLSearchParams({
    url: original,
    animated: "1",
    w: scale === ImageScale.AUTOx1080 ? "1200" : "800",
  });
  return [`/api/og-metadata/image?${query.toString()}`];
}

// Submission artwork uses the existing Next optimizer on the uploaded source,
// rather than optimizing a previously downscaled CDN copy. Keep this opt-in
// limited to first-party raster uploads covered by next.config remotePatterns.
function getHighQualityArtworkImageSrc(src: string): string | null {
  const original = resolveIpfsUrlSync(src);
  try {
    const url = new URL(original);
    if (
      url.origin === "https://d3lqz0a4bldqgf.cloudfront.net" &&
      url.pathname.startsWith("/drops/") &&
      /\.(jpe?g|png|webp|avif)$/i.test(url.pathname)
    )
      return original;
  } catch {
    return null;
  }
  return null;
}

type Props = Omit<ImageProps, "src" | "unoptimized" | "onError"> & {
  readonly fallback?: ReactNode;
  readonly originalSrc: string;
  readonly imageScale: ImageScale;
  readonly onError?: (() => void) | undefined;
  readonly preferHighQuality?: boolean | undefined;
  // Reports unavailable guaranteed-animated previews once per mount. A legacy
  // or external preview can still animate, but does not guarantee animation.
  readonly onAnimatedPreviewUnavailable?: (() => void) | undefined;
};

const PreviewAttempt = forwardRef<HTMLImageElement, Props>(
  (
    {
      originalSrc,
      imageScale,
      onError,
      alt,
      fallback,
      preferHighQuality = false,
      onAnimatedPreviewUnavailable,
      onLoad,
      ...props
    },
    ref
  ) => {
    const [attempt, setAttempt] = useState(0);
    const failedAttempt = useRef<number | null>(null);
    const notifiedAnimationFallback = useRef(false);
    const localSource = useLocalImagePreviewSource(originalSrc);
    const highQualitySrc = preferHighQuality
      ? getHighQualityArtworkImageSrc(originalSrc)
      : null;
    const previewSources = localSource
      ? [localSource]
      : getDropImagePreviewSources(
          originalSrc,
          imageScale,
          Boolean(onAnimatedPreviewUnavailable)
        );
    const sources = highQualitySrc
      ? [highQualitySrc, ...previewSources]
      : previewSources;
    const source = sources[attempt];
    const optimizationProps = source === highQualitySrc ? { quality: 100 } : {};
    const notifyAnimatedPreviewUnavailable = useCallback(() => {
      if (!isGifImageUrl(originalSrc) || notifiedAnimationFallback.current)
        return;
      notifiedAnimationFallback.current = true;
      onAnimatedPreviewUnavailable?.();
    }, [originalSrc, onAnimatedPreviewUnavailable]);

    useEffect(() => {
      // This callback uses an internal notification guard, not the forwarded DOM ref.
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-ref-to-parent
      if (sources.length === 0) notifyAnimatedPreviewUnavailable();
    }, [sources.length, notifyAnimatedPreviewUnavailable]);

    return (
      <>
        {fallback === undefined && (
          <span
            role="status"
            className={
              source
                ? "tw-sr-only"
                : "tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-text-center tw-text-sm tw-text-iron-400"
            }
          >
            {!source && t(DEFAULT_LOCALE, "drop.media.previewUnavailable")}
          </span>
        )}
        {source ? (
          <Image
            {...props}
            alt={alt}
            ref={ref}
            src={source}
            unoptimized={source !== highQualitySrc}
            {...optimizationProps}
            onLoad={(event) => {
              onLoad?.(event);
              // Legacy and external previews can be stills. Only the versioned
              // GIF contract guarantees animation without inspecting the bytes.
              if (getLegacyGifPreviewUri(source) === source)
                notifyAnimatedPreviewUnavailable();
            }}
            onError={() => {
              // Repeated errors from one source must not skip its fallback or
              // notify the parent twice before React commits the next render.
              if (failedAttempt.current === attempt) return;
              failedAttempt.current = attempt;
              setAttempt(attempt + 1);
              const nextSource = sources[attempt + 1];
              if (
                !nextSource ||
                getLegacyGifPreviewUri(nextSource) === nextSource
              )
                notifyAnimatedPreviewUnavailable();
              if (attempt + 1 === sources.length) onError?.();
            }}
          />
        ) : (
          fallback
        )}
      </>
    );
  }
);
PreviewAttempt.displayName = "PreviewAttempt";

// A new gallery item or retry starts with its own preview, never the old source.
export const DropImagePreview = forwardRef<HTMLImageElement, Props>(
  (props, ref) => (
    <PreviewAttempt
      key={`${props.originalSrc}:${props.imageScale}:${props.preferHighQuality ?? false}:${Boolean(props.onAnimatedPreviewUnavailable)}`}
      {...props}
      ref={ref}
    />
  )
);
DropImagePreview.displayName = "DropImagePreview";
