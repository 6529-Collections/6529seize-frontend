"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { LinkPreviewCardLayout } from "./OpenGraphPreview";

export type OfficePreviewType = "office.word" | "office.excel" | "office.powerpoint";

export interface OfficePreviewLinks {
  readonly open: string;
  readonly preview: string | null;
  readonly officeViewer?: string | null;
  readonly exportPdf?: string | null;
}

export interface OfficePreviewData {
  readonly type: OfficePreviewType;
  readonly title: string;
  readonly canonicalUrl: string;
  readonly thumbnail: string | null;
  readonly links: OfficePreviewLinks;
  readonly availability: "public" | "unavailable";
  readonly excel?: { readonly allowInteractivity: boolean };
}

interface OfficePreviewCardProps {
  readonly href: string;
  readonly data: OfficePreviewData;
}

interface ProductInfo {
  readonly label: string;
  readonly accent: string;
  readonly initial: string;
}

const PRODUCT_MAP: Record<OfficePreviewType, ProductInfo> = {
  "office.word": {
    label: "Microsoft Word",
    accent: "#185ABD",
    initial: "W",
  },
  "office.excel": {
    label: "Microsoft Excel",
    accent: "#107C41",
    initial: "X",
  },
  "office.powerpoint": {
    label: "Microsoft PowerPoint",
    accent: "#D24726",
    initial: "P",
  },
};

const getDomain = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
};

const buildPreviewTitle = (data: OfficePreviewData): string => {
  const product = PRODUCT_MAP[data.type];
  return `${product.label} preview`;
};

const thumbnailAlt = (data: OfficePreviewData): string => {
  const fallback = PRODUCT_MAP[data.type].label;
  return `Preview of ${data.title || fallback}`;
};

export default function OfficePreviewCard({ href, data }: OfficePreviewCardProps) {
  const product = PRODUCT_MAP[data.type];
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const openButtonRef = useRef<HTMLAnchorElement | null>(null);
  const previewButtonRef = useRef<HTMLButtonElement | null>(null);

  const previewSource = useMemo(() => {
    return data.links.preview ?? data.links.officeViewer ?? null;
  }, [data.links.officeViewer, data.links.preview]);

  const previewAvailable = data.availability === "public" && Boolean(previewSource);

  useEffect(() => {
    if (!previewAvailable) {
      setShowPreview(false);
    }
  }, [previewAvailable]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        openButtonRef.current?.click();
        return;
      }

      if (event.key === " " || event.key === "Spacebar") {
        if (!previewAvailable) {
          return;
        }
        event.preventDefault();
        setShowPreview((value) => !value);
        return;
      }

      if (event.key === "Escape" && showPreview) {
        event.preventDefault();
        setShowPreview(false);
        previewButtonRef.current?.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
    };
  }, [previewAvailable, showPreview]);

  useEffect(() => {
    if (!showPreview) {
      return;
    }

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowPreview(false);
        previewButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [showPreview]);

  const domain = useMemo(() => getDomain(data.canonicalUrl), [data.canonicalUrl]);
  const ariaLabel = buildPreviewTitle(data);
  const previewButtonLabel = showPreview ? "Hide live view" : "View live";
  const availabilityNotice =
    data.availability === "unavailable"
      ? "Live preview is not available for this link."
      : !previewAvailable
      ? "Live preview unavailable."
      : null;

  return (
    <LinkPreviewCardLayout href={href}>
      <div
        ref={containerRef}
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-space-y-4"
        tabIndex={0}
        role="group"
        aria-label={ariaLabel}
      >
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4">
          <div className="tw-w-full lg:tw-w-56 lg:tw-flex-shrink-0">
            {data.thumbnail ? (
              <img
                src={data.thumbnail}
                alt={thumbnailAlt(data)}
                loading="lazy"
                className="tw-h-40 tw-w-full tw-rounded-lg tw-object-cover tw-bg-iron-800/40"
              />
            ) : (
              <div
                className="tw-flex tw-h-40 tw-w-full tw-flex-col tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800/40"
                style={{ border: `1px solid ${product.accent}` }}
                aria-hidden="true"
              >
                <span
                  className="tw-text-3xl tw-font-semibold"
                  style={{ color: product.accent }}
                >
                  {product.initial}
                </span>
              </div>
            )}
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-2">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <span
                className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-black/20 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold"
                style={{ color: product.accent }}
              >
                {product.label}
              </span>
              {domain && (
                <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                  {domain}
                </span>
              )}
            </div>
            <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-leading-snug tw-break-words">
              {data.title}
            </h3>
            <p className="tw-m-0 tw-text-sm tw-text-iron-300 tw-break-words tw-leading-relaxed">
              Open or preview this file directly from Microsoft 365.
            </p>
            {availabilityNotice && (
              <p className="tw-m-0 tw-text-xs tw-text-iron-400">{availabilityNotice}</p>
            )}
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
              <a
                ref={openButtonRef}
                href={data.links.open}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-transparent tw-bg-primary-500/80 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-transition hover:tw-bg-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300"
                aria-label={`Open ${product.label}`}
              >
                Open in Microsoft 365
              </a>
              {previewAvailable && (
                <button
                  ref={previewButtonRef}
                  type="button"
                  onClick={() => setShowPreview((value) => !value)}
                  className="tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition hover:tw-border-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300"
                  aria-expanded={showPreview}
                  aria-controls="office-preview-frame"
                >
                  {previewButtonLabel}
                </button>
              )}
            </div>
          </div>
        </div>
        {showPreview && previewSource && (
          <div
            className="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700"
            data-testid="office-live-preview"
          >
            <iframe
              id="office-preview-frame"
              src={previewSource}
              title={ariaLabel}
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="no-referrer"
              className="tw-h-[22rem] tw-w-full tw-bg-iron-900"
              allowFullScreen={false}
            />
          </div>
        )}
      </div>
    </LinkPreviewCardLayout>
  );
}
