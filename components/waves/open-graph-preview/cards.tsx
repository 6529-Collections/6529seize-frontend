import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { removeBaseEndpoint } from "@/helpers/Helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  GithubPreviewEnvelope,
  GithubPreviewResponse,
  GithubStatusPreviewResponse,
} from "@/services/api/github-preview-api";
import type {
  ExternalFileLinkPreviewResponse,
  FarcasterEmbedLinkPreview,
  SeizeCollectionLinkPreview,
  YoutubeVideoLinkPreview,
} from "@/services/api/link-preview-api";
import {
  getNormalizedMimeType,
  type ExternalFileKind,
} from "@/lib/link-preview/fileKinds";
import {
  formatFileSizeLabel,
  getLocalizedFileKindLabel,
} from "@/lib/link-preview/filePreviewI18n";
import ChatItemHrefButtons from "../ChatItemHrefButtons";
import {
  useLinkPreviewVariant,
  type LinkPreviewVariant,
} from "../LinkPreviewContext";
import {
  DESCRIPTION_KEYS,
  extractImageUrl,
  readFirstString,
  TITLE_KEYS,
  wrapLongUnbrokenSegments,
} from "./core";
import type { OpenGraphPreviewData } from "./types";

const TRUSTED_YOUTUBE_EMBED_HOSTS = [
  "youtube-nocookie.com",
  "youtube.com",
] as const;
const FARCASTER_EMBED_TYPES = new Set(["miniapp", "frame", "legacy-frame"]);

function GenericOpenGraphMetaRow({
  author,
  publishedDate,
  publishedDateTime,
  locale,
}: {
  readonly author?: string | undefined;
  readonly publishedDate?: string | undefined;
  readonly publishedDateTime?: string | undefined;
  readonly locale: SupportedLocale;
}) {
  if (!author && !publishedDate) {
    return null;
  }

  const byline = author
    ? t(locale, "linkPreview.byline", {
        author,
      })
    : undefined;

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-leading-5 tw-text-iron-400">
      {byline && (
        <span className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-baseline tw-gap-1">
          <span className="tw-truncate tw-font-medium tw-text-iron-200">
            {wrapLongUnbrokenSegments(byline)}
          </span>
        </span>
      )}
      {author && publishedDate && (
        <span className="tw-text-iron-600" aria-hidden="true">
          /
        </span>
      )}
      {publishedDate && (
        <time className="tw-flex-shrink-0" dateTime={publishedDateTime}>
          {publishedDate}
        </time>
      )}
    </div>
  );
}

export function GenericOpenGraphPreviewCard({
  effectiveHref,
  linkTarget,
  linkRel,
  imageUrl,
  imageAlt,
  faviconUrl,
  title,
  description,
  domain,
  mediaTypeLabel,
  author,
  publishedDate,
  publishedDateTime,
  locale,
}: {
  readonly effectiveHref: string;
  readonly linkTarget?: "_blank" | undefined;
  readonly linkRel?: string | undefined;
  readonly imageUrl?: string | undefined;
  readonly imageAlt?: string | undefined;
  readonly faviconUrl?: string | undefined;
  readonly title: string;
  readonly description?: string | undefined;
  readonly domain?: string | undefined;
  readonly mediaTypeLabel?: string | undefined;
  readonly author?: string | undefined;
  readonly publishedDate?: string | undefined;
  readonly publishedDateTime?: string | undefined;
  readonly locale: SupportedLocale;
}) {
  const sourceLabel = domain ?? t(locale, "linkPreview.externalSourceFallback");

  return (
    <Link
      href={effectiveHref}
      target={linkTarget}
      rel={linkRel}
      className={[
        "tw-group/og-card tw-relative tw-grid tw-h-full tw-min-h-0 tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950/70 tw-p-3 tw-pr-12 tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-transition tw-duration-200 hover:tw-border-sky-400/40 hover:tw-bg-iron-900/80 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-pr-14",
        imageUrl
          ? "tw-grid-cols-[6rem,minmax(0,1fr)] tw-gap-3 sm:tw-grid-cols-[8rem,minmax(0,1fr)] md:tw-grid-cols-[10.5rem,minmax(0,1fr)]"
          : "tw-grid-cols-1",
      ].join(" ")}
      data-testid="og-preview-card"
    >
      <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-bg-sky-400/70" />
      {imageUrl && (
        <span className="tw-relative tw-block tw-aspect-[16/10] tw-h-full tw-min-h-[6.5rem] tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-black/40 sm:tw-min-h-[7.5rem]">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="tw-object-cover tw-transition tw-duration-300 group-hover/og-card:tw-scale-[1.02]"
            loading="lazy"
            sizes="(max-width: 640px) 6rem, (max-width: 768px) 8rem, 10.5rem"
            unoptimized
          />
        </span>
      )}
      <span className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-col tw-justify-center tw-gap-1.5 tw-overflow-hidden">
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
          {faviconUrl && (
            <span className="tw-relative tw-block tw-h-4 tw-w-4 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-sm tw-bg-iron-800">
              <Image
                src={faviconUrl}
                alt=""
                fill
                className="tw-object-contain"
                loading="lazy"
                sizes="16px"
                unoptimized
              />
            </span>
          )}
          <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-300">
            {wrapLongUnbrokenSegments(sourceLabel)}
          </span>
          {mediaTypeLabel && (
            <span className="tw-flex-shrink-0 tw-rounded-md tw-border tw-border-sky-400/25 tw-bg-sky-400/10 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-4 tw-text-sky-100">
              {mediaTypeLabel}
            </span>
          )}
        </span>
        <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 tw-transition tw-duration-200 group-hover/og-card:tw-text-white md:tw-text-lg">
          {wrapLongUnbrokenSegments(title)}
        </span>
        <GenericOpenGraphMetaRow
          author={author}
          publishedDate={publishedDate}
          publishedDateTime={publishedDateTime}
          locale={locale}
        />
        {description && (
          <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-whitespace-pre-line tw-break-words tw-text-xs tw-leading-5 tw-text-iron-300 md:tw-text-sm">
            {wrapLongUnbrokenSegments(description)}
          </span>
        )}
      </span>
    </Link>
  );
}

const FILE_KIND_ACCENTS: Record<
  ExternalFileKind,
  {
    readonly rail: string;
    readonly badge: string;
  }
> = {
  pdf: {
    rail: "tw-bg-rose-500",
    badge: "tw-border-rose-400/30 tw-bg-rose-500/10 tw-text-rose-100",
  },
  csv: {
    rail: "tw-bg-emerald-500",
    badge: "tw-border-emerald-400/30 tw-bg-emerald-500/10 tw-text-emerald-100",
  },
  text: {
    rail: "tw-bg-sky-500",
    badge: "tw-border-sky-400/30 tw-bg-sky-500/10 tw-text-sky-100",
  },
  code: {
    rail: "tw-bg-sky-500",
    badge: "tw-border-sky-400/30 tw-bg-sky-500/10 tw-text-sky-100",
  },
  image: {
    rail: "tw-bg-fuchsia-500",
    badge: "tw-border-fuchsia-400/30 tw-bg-fuchsia-500/10 tw-text-fuchsia-100",
  },
  audio: {
    rail: "tw-bg-violet-500",
    badge: "tw-border-violet-400/30 tw-bg-violet-500/10 tw-text-violet-100",
  },
  video: {
    rail: "tw-bg-violet-500",
    badge: "tw-border-violet-400/30 tw-bg-violet-500/10 tw-text-violet-100",
  },
  archive: {
    rail: "tw-bg-amber-500",
    badge: "tw-border-amber-400/30 tw-bg-amber-500/10 tw-text-amber-100",
  },
  document: {
    rail: "tw-bg-blue-500",
    badge: "tw-border-blue-400/30 tw-bg-blue-500/10 tw-text-blue-100",
  },
  spreadsheet: {
    rail: "tw-bg-emerald-500",
    badge: "tw-border-emerald-400/30 tw-bg-emerald-500/10 tw-text-emerald-100",
  },
  presentation: {
    rail: "tw-bg-orange-500",
    badge: "tw-border-orange-400/30 tw-bg-orange-500/10 tw-text-orange-100",
  },
  binary: {
    rail: "tw-bg-iron-500",
    badge: "tw-border-iron-500/40 tw-bg-iron-700/30 tw-text-iron-100",
  },
  unknown: {
    rail: "tw-bg-iron-500",
    badge: "tw-border-iron-500/40 tw-bg-iron-700/30 tw-text-iron-100",
  },
};

function truncateMiddle(value: string, maxLength = 86): string {
  if (value.length <= maxLength) {
    return value;
  }

  const tailLength = Math.floor((maxLength - 3) / 2);
  const headLength = maxLength - 3 - tailLength;
  return `${value.slice(0, headLength)}...${value.slice(-tailLength)}`;
}

export function ExternalFilePreviewCard({
  href,
  preview,
  effectiveHref,
  linkTarget,
  linkRel,
  variant,
  hideActions,
  locale,
}: {
  readonly href: string;
  readonly preview: ExternalFileLinkPreviewResponse;
  readonly effectiveHref: string;
  readonly linkTarget?: "_blank" | undefined;
  readonly linkRel?: string | undefined;
  readonly variant: LinkPreviewVariant;
  readonly hideActions: boolean;
  readonly locale: SupportedLocale;
}) {
  const accent = FILE_KIND_ACCENTS[preview.fileKind];
  const kindLabel = getLocalizedFileKindLabel(locale, preview.fileKind);
  const mimeType = getNormalizedMimeType(preview.contentType);
  const fileSize = formatFileSizeLabel(preview.sizeBytes, locale);
  const facts = [
    mimeType
      ? { label: t(locale, "linkPreview.file.fact.mime"), value: mimeType }
      : null,
    fileSize
      ? { label: t(locale, "linkPreview.file.fact.size"), value: fileSize }
      : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={variant}
      hideActions={hideActions}
    >
      <Link
        href={preview.links.open || effectiveHref}
        target={linkTarget}
        rel={linkRel}
        onClick={(event) => event.stopPropagation()}
        className={[
          "tw-group/file-card tw-relative tw-block tw-h-full tw-min-h-0 tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950/75 tw-p-3 tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-transition tw-duration-200 hover:tw-border-iron-600 hover:tw-bg-iron-900/80 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-p-4",
          hideActions ? "" : "tw-pr-12 sm:tw-pr-14",
        ].join(" ")}
        data-testid="external-file-preview-card"
      >
        <span
          className={`tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 ${accent.rail}`}
        />
        <span className="tw-grid tw-h-full tw-min-h-0 tw-w-full tw-min-w-0 tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-[4.25rem,minmax(0,1fr)] sm:tw-items-center">
          <span className="tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-black/30 tw-shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:tw-h-[4.25rem] sm:tw-w-[4.25rem]">
            <span
              className={`tw-inline-flex tw-max-w-full tw-items-center tw-rounded-md tw-border tw-border-solid tw-px-2 tw-py-1 tw-text-xs tw-font-bold tw-leading-4 ${accent.badge}`}
            >
              {kindLabel}
            </span>
          </span>
          <span className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-col tw-justify-center tw-gap-2 tw-overflow-hidden">
            <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
              <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-300">
                {preview.sourceHost}
              </span>
              <span className="tw-flex-shrink-0 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/80 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-300">
                {t(locale, "linkPreview.file.externalSource")}
              </span>
            </span>
            <span className="tw-min-w-0 tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 sm:tw-text-lg">
              <span className="tw-block tw-truncate">
                {truncateMiddle(preview.title || preview.fileName)}
              </span>
            </span>
            <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-2">
              {facts.map((fact) => (
                <span
                  key={`${fact.label}-${fact.value}`}
                  className="tw-inline-flex tw-max-w-full tw-items-baseline tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/70 tw-px-2 tw-py-1 tw-text-xs tw-leading-4"
                >
                  <span className="tw-flex-shrink-0 tw-text-iron-500">
                    {fact.label}
                  </span>
                  <span className="tw-min-w-0 tw-truncate tw-font-semibold tw-text-iron-200">
                    {fact.value}
                  </span>
                </span>
              ))}
              <span className="tw-inline-flex tw-max-w-full tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-black/20 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-200 tw-transition group-hover/file-card:tw-border-sky-400/35 group-hover/file-card:tw-text-white">
                {t(locale, "linkPreview.file.openSource")}
              </span>
            </span>
          </span>
        </span>
      </Link>
    </LinkPreviewCardLayout>
  );
}

function isGithubPreviewResponse(
  value: unknown
): value is GithubPreviewResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const type = (value as { readonly type?: unknown }).type;
  return (
    type === "github.issue" ||
    type === "github.pull_request" ||
    type === "github.repository" ||
    type === "github.file" ||
    type === "github.directory" ||
    type === "github.commit" ||
    type === "github.release" ||
    type === "github.actions" ||
    type === "github.discussion"
  );
}

export function extractGithubPreview(
  preview: OpenGraphPreviewData | null | undefined
): GithubPreviewResponse | null {
  const githubPreview = (preview as GithubPreviewEnvelope | null | undefined)
    ?.githubPreview;
  return isGithubPreviewResponse(githubPreview) ? githubPreview : null;
}

function isExternalFilePreview(
  value: unknown
): value is ExternalFileLinkPreviewResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as {
    readonly type?: unknown;
    readonly links?: { readonly open?: unknown } | undefined;
  };
  return (
    record.type === "external.file" && typeof record.links?.open === "string"
  );
}

export function extractExternalFilePreview(
  preview: OpenGraphPreviewData | null | undefined
): ExternalFileLinkPreviewResponse | null {
  return isExternalFilePreview(preview) ? preview : null;
}

export function isGithubStatusPreviewResponse(
  preview: GithubPreviewResponse | null
): preview is GithubStatusPreviewResponse {
  return (
    preview?.type === "github.issue" || preview?.type === "github.pull_request"
  );
}

function isSeizeCollectionPreview(
  value: unknown
): value is SeizeCollectionLinkPreview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as { readonly type?: unknown; readonly title?: unknown };
  return record.type === "6529.collection" && typeof record.title === "string";
}

export function extractSeizeCollectionPreview(
  preview: OpenGraphPreviewData | null | undefined
): SeizeCollectionLinkPreview | null {
  return isSeizeCollectionPreview(preview) ? preview : null;
}

function isYoutubeVideoPreview(
  value: unknown
): value is YoutubeVideoLinkPreview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as {
    readonly type?: unknown;
    readonly videoId?: unknown;
    readonly embedUrl?: unknown;
  };
  return (
    record.type === "youtube.video" &&
    typeof record.videoId === "string" &&
    typeof record.embedUrl === "string"
  );
}

export function extractYoutubeVideoPreview(
  preview: OpenGraphPreviewData | null | undefined
): YoutubeVideoLinkPreview | null {
  return isYoutubeVideoPreview(preview) ? preview : null;
}

function isFarcasterEmbedPreview(
  value: unknown
): value is FarcasterEmbedLinkPreview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as {
    readonly type?: unknown;
    readonly embedKind?: unknown;
  };

  return (
    (record.type === "farcaster.miniapp" ||
      record.type === "farcaster.frame") &&
    typeof record.embedKind === "string" &&
    FARCASTER_EMBED_TYPES.has(record.embedKind)
  );
}

export function extractFarcasterEmbedPreview(
  preview: OpenGraphPreviewData | null | undefined
): FarcasterEmbedLinkPreview | null {
  return isFarcasterEmbedPreview(preview) ? preview : null;
}

export function getTrustedYoutubeEmbedUrl(value: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== "https:" || !parsed.pathname.startsWith("/embed/")) {
    return undefined;
  }

  const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  return isTrustedYoutubeEmbedHost(hostname) ? parsed.toString() : undefined;
}

function isTrustedYoutubeEmbedHost(hostname: string): boolean {
  return TRUSTED_YOUTUBE_EMBED_HOSTS.some(
    (trustedHost) => hostname === trustedHost
  );
}

export function getHttpsHref(
  value: string | null | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function getRelativeHref(href: string): string | undefined {
  const relative = removeBaseEndpoint(href);
  if (typeof relative !== "string" || relative.length === 0) {
    return undefined;
  }

  return relative.startsWith("/") ? relative : undefined;
}

export function LinkPreviewCardLayout({
  href,
  children,
  variant,
  hideActions = false,
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly hideActions?: boolean | undefined;
}) {
  const contextVariant = useLinkPreviewVariant();
  const resolvedVariant = variant ?? contextVariant;
  const relativeHref = getRelativeHref(href);

  if (resolvedVariant === "home") {
    return (
      <div className="tw-flex tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-items-stretch">
        <div className="tw-h-full tw-min-w-0 tw-max-w-full tw-flex-1 tw-overflow-hidden focus-within:tw-overflow-visible">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="tw-group/link-card tw-relative tw-h-full tw-w-full tw-min-w-0 tw-max-w-full">
      <div className="tw-h-full tw-min-h-0 tw-min-w-0 tw-max-w-full tw-overflow-hidden focus-within:tw-overflow-visible">
        {children}
      </div>
      {!hideActions && (
        <ChatItemHrefButtons
          href={href}
          relativeHref={relativeHref}
          layout="overlay"
        />
      )}
    </div>
  );
}

export function hasOpenGraphContent(
  preview: OpenGraphPreviewData | null | undefined
): boolean {
  if (!preview) {
    return false;
  }

  if (isSeizeCollectionPreview(preview)) {
    return true;
  }

  if (isYoutubeVideoPreview(preview)) {
    return true;
  }

  if (isFarcasterEmbedPreview(preview)) {
    return true;
  }

  if (isExternalFilePreview(preview)) {
    return true;
  }

  return Boolean(
    readFirstString(preview, TITLE_KEYS) ??
    readFirstString(preview, DESCRIPTION_KEYS) ??
    extractImageUrl(preview)
  );
}

export function isExternalHref(href: string | null | undefined): boolean {
  return typeof href === "string" && /^https?:\/\//i.test(href);
}
