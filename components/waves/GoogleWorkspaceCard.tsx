"use client";

import { useEffect, useId, useMemo, useState } from "react";

import clsx from "clsx";

import Image from "next/image";
import Link from "next/link";

import type { GoogleWorkspaceLinkPreview } from "@/services/api/link-preview-api";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";

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

const getActionButtonClasses = (variant: "primary" | "secondary") =>
  clsx(
    "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-no-underline tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60",
    variant === "primary"
      ? "tw-border-primary-500 tw-bg-primary-500 tw-text-white hover:tw-bg-primary-400"
      : "tw-border-iron-700 tw-bg-transparent tw-text-iron-100 hover:tw-border-primary-400 hover:tw-text-primary-300"
  );

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
  const previewUrl = useMemo(() => {
    const rawEmbedUrl =
      "embedPub" in data.links && typeof data.links.embedPub === "string"
        ? data.links.embedPub
        : undefined;
    if (rawEmbedUrl && rawEmbedUrl.length > 0) {
      return rawEmbedUrl;
    }

    return typeof data.links.preview === "string" &&
      data.links.preview.length > 0
      ? data.links.preview
      : undefined;
  }, [data.links]);
  const canShowPreview = Boolean(previewUrl);
  const viewLiveActive = showPreview && canShowPreview;
  const activePreviewUrl = viewLiveActive ? previewUrl : undefined;

  const domain = useMemo(() => {
    try {
      const parsed = new URL(data.links.open);
      return parsed.hostname.replace(/^www\./i, "");
    } catch {
      return "docs.google.com";
    }
  }, [data.links.open]);

  const openLabel = `Open in ${productName}`;
  const downloadUrl =
    "exportPdf" in data.links && typeof data.links.exportPdf === "string"
      ? data.links.exportPdf
      : undefined;

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
              <div className="tw-relative tw-aspect-video tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60">
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
              <h3 className="tw-line-clamp-2 tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-100">
                {displayTitle}
              </h3>
              {data.availability === "restricted" ? (
                <p className="tw-m-0 tw-text-sm tw-text-amber-300">
                  This file may require permission to view. You can still open
                  it directly in {productName}.
                </p>
              ) : null}
            </div>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <Link
              href={data.links.open}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
              className={getActionButtonClasses("primary")}
              aria-label={`${openLabel} (opens in a new tab)`}
            >
              {openLabel}
            </Link>
            {canShowPreview ? (
              <button
                type="button"
                onClick={handleTogglePreview}
                className={getActionButtonClasses("secondary")}
                aria-controls={previewContainerId}
                aria-expanded={viewLiveActive}
                aria-pressed={viewLiveActive}
                aria-label={`${viewLiveActive ? "Hide" : "View"} live preview for ${productName}`}
              >
                {viewLiveActive ? "Hide live preview" : "View live preview"}
              </button>
            ) : null}
            {downloadUrl ? (
              <Link
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                className={getActionButtonClasses("secondary")}
                aria-label={`Download ${productName} as PDF (opens in a new tab)`}
              >
                Download PDF
              </Link>
            ) : null}
          </div>
          {activePreviewUrl ? (
            <div
              className="tw-space-y-3"
              id={previewContainerId}
              role="region"
              aria-label={`${productName} live preview`}
            >
              <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/30 tw-p-2">
                <iframe
                  src={activePreviewUrl}
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
