"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Document, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import usePdfPinchZoom from "./usePdfPinchZoom";
import PdfAttachmentPage from "./PdfAttachmentPage";
import PdfOriginalLink from "./PdfOriginalLink";
import {
  fetchPdfPreview,
  PdfPreviewSizeError,
  PDF_PREVIEW_TIMEOUT_MS,
} from "./fetchPdfPreview";

const assetBase = `/pdfjs/${pdfjs.version}/`;
pdfjs.GlobalWorkerOptions.workerSrc = `${assetBase}pdf.worker.min.mjs`;
const options = {
  cMapUrl: `${assetBase}cmaps/`,
  standardFontDataUrl: `${assetBase}standard_fonts/`,
  wasmUrl: `${assetBase}wasm/`,
  isEvalSupported: false,
  useWasm: false,
};
const PREVIEW_ERROR_KEY = "attachment.pdf.error";

export default function PdfAttachmentReader({ url }: { readonly url: string }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <PdfReaderSession
      key={attempt}
      url={url}
      focusOnMount={attempt > 0}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  );
}

function PdfReaderSession({
  url,
  focusOnMount,
  onRetry,
}: {
  readonly url: string;
  readonly focusOnMount: boolean;
  readonly onRetry: () => void;
}) {
  const documentRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(1);
  const previousWidthRef = useRef(0);
  const restorePageRef = useRef<number | null>(null);
  const [file, setFile] = useState<{ data: Uint8Array } | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  usePdfPinchZoom(viewportRef, documentRef, pages > 0 && !error);

  useEffect(() => {
    if (focusOnMount) viewportRef.current?.focus();
  }, [focusOnMount]);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timeout = globalThis.setTimeout(
      () => controller.abort(),
      PDF_PREVIEW_TIMEOUT_MS
    );
    void fetchPdfPreview(url, controller.signal)
      .then((data) => {
        if (!disposed) setFile({ data });
      })
      .catch((cause: unknown) => {
        if (!disposed)
          setError(
            cause instanceof PdfPreviewSizeError
              ? "attachment.pdf.tooLarge"
              : PREVIEW_ERROR_KEY
          );
      })
      .finally(() => globalThis.clearTimeout(timeout));
    return () => {
      disposed = true;
      controller.abort();
      globalThis.clearTimeout(timeout);
    };
  }, [url]);

  useEffect(() => {
    if (!file || pages > 0 || error) return;
    const timeout = globalThis.setTimeout(
      () => setError(PREVIEW_ERROR_KEY),
      PDF_PREVIEW_TIMEOUT_MS
    );
    return () => globalThis.clearTimeout(timeout);
  }, [file, pages, error]);

  const updateCurrentPage = useCallback((container: HTMLDivElement) => {
    // A rotation resizes the viewport before React has resized the pages. Keep
    // the reading position until both widths agree.
    if (
      Math.abs(
        (documentRef.current?.offsetWidth ?? 0) - container.clientWidth
      ) > 1
    )
      return;
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-pdf-page]")
    );
    if (!elements.length) return;
    const atEnd =
      container.scrollTop > 0 &&
      container.scrollTop + container.clientHeight >=
        container.scrollHeight - 2;
    const readingLine =
      container.getBoundingClientRect().top + container.clientHeight * 0.3;
    const current = atEnd
      ? elements.at(-1)
      : elements.findLast(
          (element) => element.getBoundingClientRect().top <= readingLine
        );
    const nextPage = Number(current?.dataset["pdfPage"] ?? 1);
    currentPageRef.current = nextPage;
    setPage(nextPage);
  }, []);

  const observeContainer = useCallback((container: HTMLDivElement | null) => {
    viewportRef.current = container;
    setScrollRoot(container);
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const width = Math.floor(entry.contentRect.width);
        if (
          previousWidthRef.current > 0 &&
          width !== previousWidthRef.current
        ) {
          restorePageRef.current = currentPageRef.current;
        }
        previousWidthRef.current = width;
        setSize({
          width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const frame = requestAnimationFrame(() => {
      if (restorePageRef.current !== null) {
        const restoredPage = viewport.querySelector<HTMLElement>(
          `[data-pdf-page="${restorePageRef.current}"]`
        );
        if (restoredPage) {
          viewport.scrollTop +=
            restoredPage.getBoundingClientRect().top -
            viewport.getBoundingClientRect().top;
        }
        restorePageRef.current = null;
      }
      updateCurrentPage(viewport);
    });
    return () => cancelAnimationFrame(frame);
  }, [size.width, size.height, pages, updateCurrentPage]);
  const onPageError = useCallback(() => setError(PREVIEW_ERROR_KEY), []);
  const loading = (
    <p role="status" className="tw-p-4">
      {t(DEFAULT_LOCALE, "attachment.pdf.loading")}
    </p>
  );

  let content = loading;
  if (error) {
    content = (
      <div className="tw-space-y-3 tw-p-4">
        <p role="alert">{t(DEFAULT_LOCALE, error)}</p>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
          <button
            type="button"
            onClick={onRetry}
            className="tw-min-h-11 tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(DEFAULT_LOCALE, "attachment.pdf.retry")}
          </button>
          <PdfOriginalLink url={url} />
        </div>
      </div>
    );
  } else if (file) {
    content = (
      <Document
        file={file}
        options={options}
        loading={loading}
        onLoadSuccess={({ numPages }) => setPages(numPages)}
        onLoadError={onPageError}
        onPassword={() => setError("attachment.pdf.password")}
        error={null}
      >
        {size.width > 0 &&
          scrollRoot &&
          Array.from({ length: pages }, (_, index) => (
            <PdfAttachmentPage
              key={index + 1}
              page={index + 1}
              width={size.width}
              viewportHeight={size.height}
              scrollRoot={scrollRoot}
              onError={onPageError}
            />
          ))}
      </Document>
    );
  }

  return (
    <>
      {pages > 0 && !error && (
        <p className="tw-m-0 tw-shrink-0 tw-px-4 tw-py-2 tw-text-center tw-text-xs tw-text-iron-300">
          {t(DEFAULT_LOCALE, "attachment.pdf.page", {
            page: formatInteger(DEFAULT_LOCALE, page),
            total: formatInteger(DEFAULT_LOCALE, pages),
          })}
        </p>
      )}
      <div
        ref={observeContainer}
        onScroll={(event) => updateCurrentPage(event.currentTarget)}
        role="region"
        aria-label={t(DEFAULT_LOCALE, "attachment.pdf.pages")}
        tabIndex={0}
        className="tw-min-h-0 tw-flex-1 tw-touch-pan-x tw-touch-pan-y tw-overflow-auto tw-overscroll-contain focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <div ref={documentRef} style={{ width: size.width || "100%" }}>
          {content}
        </div>
      </div>
    </>
  );
}
