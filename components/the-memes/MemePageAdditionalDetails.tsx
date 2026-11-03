"use client";

import Download, { type DownloadLabels } from "@/components/download/Download";
import { publicEnv } from "@/config/env";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { normalizeDecentralizedMediaUrl } from "@/lib/media/decentralized-media";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { Tooltip } from "react-tooltip";

export type AdditionalDetailsMediaRow = {
  readonly label: string;
  readonly title: string;
  readonly url: string;
  readonly openLabel: string;
  readonly openText?: string | undefined;
  readonly extension?: string | undefined;
  readonly downloadName?: string | undefined;
  readonly downloadLabels?: Partial<DownloadLabels> | undefined;
};

const SAFE_EXTERNAL_PROTOCOLS = new Set([
  "http:",
  "https:",
  "ipfs:",
  "ar:",
  "arweave:",
]);
const SAFE_DOWNLOAD_PROTOCOLS = new Set(["http:", "https:", "blob:"]);

function getSafeUrl(
  url: string,
  allowedProtocols: ReadonlySet<string>
): string | null {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    return allowedProtocols.has(parsedUrl.protocol) ? trimmedUrl : null;
  } catch {
    return null;
  }
}

export function getSafeExternalUrl(url: string): string | null {
  const resolvedUrl =
    normalizeDecentralizedMediaUrl(url, publicEnv.MEDIA_RESOLVER_ENDPOINT) ??
    url;
  return getSafeUrl(resolvedUrl, SAFE_EXTERNAL_PROTOCOLS);
}

function getSafeDownloadUrl(url: string): string | null {
  const resolvedUrl =
    normalizeDecentralizedMediaUrl(url, publicEnv.MEDIA_RESOLVER_ENDPOINT) ??
    url;
  return getSafeUrl(resolvedUrl, SAFE_DOWNLOAD_PROTOCOLS);
}

export function AdditionalDetailsSection({
  title,
  icon,
  children,
  compactMobile = false,
}: {
  readonly compactMobile?: boolean;
  readonly title: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly children: ReactNode;
}) {
  const Icon = icon;

  return (
    <section className="tw-space-y-6">
      <div className="tw-mb-2 tw-flex tw-items-center tw-gap-3">
        <Icon
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500"
        />
        <h3 className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
          {title}
        </h3>
        <div
          className={`tw-h-px tw-min-w-10 tw-flex-grow tw-bg-gradient-to-r tw-from-iron-700 tw-to-transparent ${compactMobile ? "tw-hidden sm:tw-block" : ""}`}
        />
      </div>
      {children}
    </section>
  );
}

export function ArweaveLinkRow({
  row,
  compactMobile = false,
}: {
  readonly compactMobile?: boolean;
  readonly row: AdditionalDetailsMediaRow;
}) {
  const safeExternalUrl = getSafeExternalUrl(row.url);
  const safeDownloadUrl = getSafeDownloadUrl(row.url);

  return (
    <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-3 last:tw-border-b-0 md:tw-grid-cols-[4rem_minmax(10rem,16rem)_minmax(0,1fr)_auto] md:tw-items-center md:tw-gap-6">
      <div className="tw-text-sm tw-font-semibold tw-uppercase tw-leading-5 tw-text-iron-500">
        {row.label}
      </div>
      <div className="tw-min-w-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100 md:tw-truncate">
        {row.title}
      </div>
      {safeExternalUrl ? (
        <Link
          href={safeExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={row.url}
          className={`tw-block tw-min-w-0 tw-max-w-full tw-break-all tw-font-medium tw-no-underline hover:tw-text-iron-100 md:tw-truncate md:tw-break-normal ${compactMobile ? "tw-font-sans tw-text-xs tw-leading-[18px] tw-text-iron-500 sm:tw-font-mono sm:tw-text-sm sm:tw-leading-5 sm:tw-text-iron-400" : "tw-font-mono tw-text-sm tw-leading-5 tw-text-iron-400"}`}
        >
          {row.url}
        </Link>
      ) : (
        <span
          title={row.url}
          className={`tw-block tw-min-w-0 tw-max-w-full tw-break-all tw-font-medium tw-text-iron-500 md:tw-truncate md:tw-break-normal ${compactMobile ? "tw-font-sans tw-text-xs tw-leading-[18px] sm:tw-font-mono sm:tw-text-sm sm:tw-leading-5" : "tw-font-mono tw-text-sm tw-leading-5"}`}
        >
          {row.url}
        </span>
      )}
      <div className="tw-flex tw-w-full tw-items-center tw-justify-start tw-gap-4 md:tw-w-auto md:tw-justify-end">
        {row.downloadName && safeDownloadUrl && (
          <Download
            href={safeDownloadUrl}
            name={row.downloadName}
            extension={row.extension ?? ""}
            variant="text"
            alwaysShowText={true}
            labels={row.downloadLabels}
          />
        )}
        {safeExternalUrl && (
          <Link
            href={safeExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={row.openLabel}
            className="tw-flex tw-min-h-6 tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-500 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-100"
          >
            {row.openText ?? "Open"}
            <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function MetadataCard({
  label,
  value,
  compactMobile = false,
  className = "",
}: {
  readonly compactMobile?: boolean;
  readonly className?: string;
  readonly label: string;
  readonly value: string | number;
}) {
  const displayValue = String(value);
  const tooltipId = buildTooltipId("meme-property", label, displayValue);

  return (
    <div
      className={`tw-min-w-24 tw-flex-1 tw-flex-col tw-rounded-lg tw-border tw-border-solid tw-bg-iron-900 tw-px-3 ${compactMobile ? "tw-border-transparent tw-py-2.5 sm:tw-border-iron-800 sm:tw-py-2" : "tw-border-iron-800 tw-py-2"} ${className || "tw-flex"}`}
    >
      <span
        className={`tw-mb-1 tw-block tw-font-normal tw-uppercase tw-leading-4 tw-text-iron-500 ${compactMobile ? "tw-break-words tw-text-[10px] tw-tracking-[0.06em] sm:tw-truncate sm:tw-text-xs sm:tw-tracking-wide" : "tw-truncate tw-text-xs tw-tracking-wide"}`}
      >
        {label}
      </span>
      <span
        className={`tw-font-medium tw-text-iron-200 ${compactMobile ? "tw-break-words tw-text-[13px] tw-leading-[18px] sm:tw-truncate sm:tw-text-xs sm:tw-leading-4" : "tw-truncate tw-text-xs tw-leading-4"}`}
        data-tooltip-id={tooltipId}
      >
        {displayValue}
      </span>
      <Tooltip
        id={tooltipId}
        place="top"
        offset={8}
        opacity={1}
        style={TOOLTIP_STYLES}
      >
        <span className="tw-text-xs">{displayValue}</span>
      </Tooltip>
    </div>
  );
}

export function MetricBlock({
  label,
  value,
  highlightedLabel = false,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly highlightedLabel?: boolean | undefined;
}) {
  return (
    <div>
      <div
        className={`tw-mb-1 tw-text-sm tw-font-medium tw-leading-5 md:tw-mb-2 ${
          highlightedLabel ? "tw-text-primary-400" : "tw-text-iron-400"
        }`}
      >
        {highlightedLabel && (
          <span className="tw-mr-2 tw-inline-block tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400" />
        )}
        {label}
      </div>
      <div className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6">
        {value}
      </div>
    </div>
  );
}

export function EmptyDetailsState({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-500">
      {children}
    </div>
  );
}
