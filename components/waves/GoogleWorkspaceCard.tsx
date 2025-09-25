"use client";

import { useEffect, useId, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { LinkPreviewCardLayout } from "./OpenGraphPreview";
import type { GoogleWorkspaceLinkPreview } from "@/services/api/link-preview-api";

interface GoogleWorkspaceCardProps {
  readonly href: string;
  readonly data: GoogleWorkspaceLinkPreview;
}

const PRODUCT_CONFIG: Record<
  GoogleWorkspaceLinkPreview["type"],
  {
    readonly badge: string;
    readonly product: string;
    readonly fallbackTitle: string;
  }
> = {
  "google.docs": {
    badge: "Docs",
    product: "Google Docs",
    fallbackTitle: "Untitled Doc",
  },
  "google.sheets": {
    badge: "Sheets",
    product: "Google Sheets",
    fallbackTitle: "Untitled Sheet",
  },
  "google.slides": {
    badge: "Slides",
    product: "Google Slides",
    fallbackTitle: "Untitled Slides",
  },
};

const actionButtonBaseClasses =
  "tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

const primaryButtonClasses =
  "tw-bg-primary-500 tw-text-iron-900 hover:tw-bg-primary-400";
const secondaryButtonClasses =
  "tw-bg-transparent tw-text-iron-100 hover:tw-border-iron-400";

export default function GoogleWorkspaceCard({
  href,
  data,
}: GoogleWorkspaceCardProps) {
  const previewContainerId = useId();
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [data.thumbnail]);

  useEffect(() => {
    if (!showPreview) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowPreview(false);
      }
    };

    if (typeof globalThis.addEventListener !== "function") {
      return;
    }

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener?.("keydown", handleKeyDown);
    };
  }, [showPreview]);

  const productConfig = PRODUCT_CONFIG[data.type];
  const productName = productConfig.product;
  const displayTitle = useMemo(() => {
    if (typeof data.title === "string" && data.title.trim().length > 0) {
      return data.title.trim();
    }
    return productConfig.fallbackTitle;
  }, [data.title, productConfig.fallbackTitle]);

  const thumbnailAlt = `Preview image of ${productName}: ${displayTitle}`;
  const previewUrl =
    "embedPub" in data.links && typeof data.links.embedPub === "string"
      ? data.links.embedPub
      : data.links.preview;
  const canShowPreview = typeof previewUrl === "string" && previewUrl.length > 0;
  const viewLiveActive = showPreview && canShowPreview;

  const domain = useMemo(() => {
    try {
      const parsed = new URL(data.links.open);
      return parsed.hostname.replace(/^www\./i, "");
    } catch {
      return "docs.google.com";
    }
  }, [data.links.open]);

  const openLabel = `Open in ${productName}`;
  const downloadUrl = (data.links as { exportPdf?: string }).exportPdf;

  const handleTogglePreview = () => {
    if (!canShowPreview) {
      return;
    }
    setShowPreview((prev) => !prev);
  };

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <div className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
            <div className="md:tw-w-64 md:tw-flex-shrink-0">
              <div
                className="tw-relative tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60"
                style={{ paddingTop: "56.25%" }}
              >
                {data.thumbnail && !imageError ? (
                  <Image
                    src={data.thumbnail}
                    alt={thumbnailAlt}
                    fill
                    className="tw-h-full tw-w-full tw-object-cover"
                    sizes="(max-width: 768px) 100vw, 256px"
                    loading="lazy"
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800/80">
                    <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                      {productConfig.badge}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-3">
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-800/80 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-200">
                  {productConfig.badge}
                </span>
                <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                  {domain}
                </span>
              </div>
              <h3 className="tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-100 tw-line-clamp-2">
                {displayTitle}
              </h3>
              {data.availability === "restricted" ? (
                <p className="tw-m-0 tw-text-sm tw-text-amber-300">
                  This file may require permission to view. You can still open it directly in {productName}.
                </p>
              ) : null}
            </div>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <Link
              href={data.links.open}
              target="_blank"
              rel="noopener noreferrer"
              className={`${actionButtonBaseClasses} ${primaryButtonClasses}`}
              aria-label={`${openLabel} (opens in a new tab)`}
            >
              {openLabel}
            </Link>
            {canShowPreview ? (
              <button
                type="button"
                onClick={handleTogglePreview}
                className={`${actionButtonBaseClasses} ${secondaryButtonClasses}`}
                aria-controls={previewContainerId}
                aria-expanded={viewLiveActive}
                aria-label={`${viewLiveActive ? "Hide" : "View"} live preview for ${productName}`}
              >
                {viewLiveActive ? "Hide live preview" : "View live"}
              </button>
            ) : null}
            {downloadUrl ? (
              <Link
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${actionButtonBaseClasses} ${secondaryButtonClasses}`}
                aria-label={`Download ${productName} as PDF (opens in a new tab)`}
              >
                Download PDF
              </Link>
            ) : null}
          </div>
          {viewLiveActive ? (
            <div className="tw-space-y-3" id={previewContainerId}>
              <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/30 tw-p-2">
                <iframe
                  src={previewUrl}
                  title={`${productName} live preview`}
                  className="tw-h-72 tw-w-full tw-rounded tw-border-0 tw-bg-iron-900"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}
