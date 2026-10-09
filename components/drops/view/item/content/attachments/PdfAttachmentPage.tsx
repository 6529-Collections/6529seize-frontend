"use client";

import { useCallback, useState } from "react";
import { Page } from "react-pdf";
import type { PDFPageProxy } from "pdfjs-dist";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export default function PdfAttachmentPage({
  page,
  width,
  scrollRoot,
  viewportHeight,
  onError,
}: {
  readonly page: number;
  readonly width: number;
  readonly scrollRoot: HTMLDivElement;
  readonly viewportHeight: number;
  readonly onError: () => void;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const onLoad = useCallback(
    (loaded: PDFPageProxy) => {
      const viewport = loaded.getViewport({ scale: 1 });
      const ratio = viewport.height / viewport.width;
      if (!Number.isFinite(ratio) || ratio <= 0) {
        onError();
        return;
      }
      setAspectRatio(ratio);
    },
    [onError]
  );
  const observePage = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;
      const nearby = new IntersectionObserver(
        ([entry]) => {
          setNearViewport(entry?.isIntersecting ?? false);
        },
        { root: scrollRoot, rootMargin: `${viewportHeight}px 0px` }
      );
      nearby.observe(element);
      return () => {
        nearby.disconnect();
      };
    },
    [scrollRoot, viewportHeight]
  );
  const ratio = aspectRatio ?? Math.SQRT2;
  // Keep raster memory bounded on iPad and unusually shaped pages. Pages away
  // from the viewport retain their measured space, without canvases or text layers.
  const pixelRatio = Math.min(
    globalThis.devicePixelRatio || 1,
    3,
    Math.sqrt(4_000_000 / (width * width * ratio)),
    4096 / width,
    4096 / (width * ratio)
  );
  const render = nearViewport && aspectRatio !== null;
  return (
    <div
      ref={observePage}
      className="tw-relative tw-mb-3 tw-bg-white"
      style={{ aspectRatio: `1 / ${ratio}` }}
      data-pdf-page={page}
    >
      <h3 className="tw-sr-only">
        {t(DEFAULT_LOCALE, "attachment.pdf.pageHeading", {
          page: formatInteger(DEFAULT_LOCALE, page),
        })}
      </h3>
      <Page
        pageNumber={page}
        width={width}
        devicePixelRatio={pixelRatio}
        renderMode={render ? "canvas" : "none"}
        renderTextLayer={render}
        renderAnnotationLayer={false}
        onLoadSuccess={onLoad}
        onLoadError={onError}
        onRenderError={onError}
        loading={
          nearViewport ? (
            <p role="status" className="tw-p-4 tw-text-iron-900">
              {t(DEFAULT_LOCALE, "attachment.pdf.loadingPage")}
            </p>
          ) : null
        }
        error={null}
      />
    </div>
  );
}
