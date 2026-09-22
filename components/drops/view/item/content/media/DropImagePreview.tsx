"use client";

import { isAllowedOgImageSourceUrl } from "@/app/api/og-metadata/_lib/imageProxyPolicy";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Image, { type ImageProps } from "next/image";
import { forwardRef, useRef, useState, type ReactNode } from "react";

export function getDropImagePreviewSources(src: string, scale: ImageScale) {
  const original = resolveIpfsUrlSync(src);
  // An IPFS gateway URL is still an original, even when resolving it changes
  // the URL string. Try bounded CDN copies before the guarded external proxy.
  const sources = [scale, ImageScale.AUTOx450]
    .map((size) => getScaledImageUri(original, size))
    .filter(
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

type Props = Omit<ImageProps, "src" | "unoptimized" | "onError"> & {
  readonly fallback?: ReactNode;
  readonly originalSrc: string;
  readonly imageScale: ImageScale;
  readonly onError?: (() => void) | undefined;
};

const PreviewAttempt = forwardRef<HTMLImageElement, Props>(
  ({ originalSrc, imageScale, onError, alt, fallback, ...props }, ref) => {
    const [attempt, setAttempt] = useState(0);
    const failedAttempt = useRef<number | null>(null);
    const sources = getDropImagePreviewSources(originalSrc, imageScale);
    const source = sources[attempt];

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
            unoptimized
            onError={() => {
              // Repeated errors from one source must not skip its fallback or
              // notify the parent twice before React commits the next render.
              if (failedAttempt.current === attempt) return;
              failedAttempt.current = attempt;
              setAttempt(attempt + 1);
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
      key={`${props.originalSrc}:${props.imageScale}`}
      {...props}
      ref={ref}
    />
  )
);
DropImagePreview.displayName = "DropImagePreview";
