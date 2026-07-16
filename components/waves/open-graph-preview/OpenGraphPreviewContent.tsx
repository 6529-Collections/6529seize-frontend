import type { ReactElement } from "react";

import Image from "next/image";
import Link from "next/link";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { GithubPreviewResponse } from "@/services/api/github-preview-api";
import type {
  ExternalFileLinkPreviewResponse,
  FarcasterEmbedLinkPreview,
  SeizeCollectionLinkPreview,
  YoutubeVideoLinkPreview,
} from "@/services/api/link-preview-api";
import GithubPreviewStatusBadge from "../GithubPreviewStatusBadge";
import {
  useLinkPreviewVariant,
  type LinkPreviewVariant,
} from "../LinkPreviewContext";
import {
  AUTHOR_KEYS,
  DESCRIPTION_KEYS,
  deriveDomain,
  extractFaviconUrl,
  extractImageAlt,
  extractImageUrl,
  formatPublishedDate,
  getFirstPartyOgKindFromImageUrl,
  getPublishedDateTime,
  MEDIA_TYPE_KEYS,
  normalizeMediaTypeLabel,
  PUBLISHED_TIME_KEYS,
  readFirstString,
  TITLE_KEYS,
  wrapLongUnbrokenSegments,
} from "./core";
import {
  ExternalFilePreviewCard,
  extractExternalFilePreview,
  extractFarcasterEmbedPreview,
  extractGithubPreview,
  extractSeizeCollectionPreview,
  extractYoutubeVideoPreview,
  GenericOpenGraphPreviewCard,
  getRelativeHref,
  isGithubStatusPreviewResponse,
  LinkPreviewCardLayout,
} from "./cards";
import {
  FarcasterEmbedPreviewCard,
  FirstPartyOpenGraphPreviewCard,
  SeizeCollectionPreviewCard,
  YoutubeVideoPreviewCard,
} from "./specializedCards";
import type {
  FirstPartyOpenGraphPreviewKind,
  OpenGraphPreviewProps,
  RoutedPreviewCardProps,
} from "./types";

function OpenGraphPreviewSkeleton({
  href,
  variant,
  hideActions,
}: {
  readonly href: string;
  readonly variant: LinkPreviewVariant;
  readonly hideActions: boolean;
}) {
  if (variant === "home") {
    return (
      <LinkPreviewCardLayout
        href={href}
        variant={variant}
        hideActions={hideActions}
      >
        <div
          className="tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30"
          data-testid="og-preview-skeleton"
        >
          <div className="tw-absolute tw-inset-0 tw-animate-pulse tw-bg-gradient-to-br tw-from-iron-900/40 tw-via-iron-800/20 tw-to-iron-900/40" />
          <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-flex-col tw-justify-end tw-gap-2 tw-p-4">
            <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-800/50" />
            <div className="tw-h-5 tw-w-3/4 tw-rounded tw-bg-iron-800/40" />
            <div className="tw-h-4 tw-w-2/3 tw-rounded tw-bg-iron-800/30" />
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={variant}
      hideActions={hideActions}
    >
      <div className="tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <div
          className="tw-flex tw-h-full tw-min-h-0 tw-animate-pulse tw-flex-col tw-justify-end tw-gap-y-3"
          data-testid="og-preview-skeleton"
        >
          <div className="tw-h-16 tw-w-full tw-flex-shrink-0 tw-rounded-lg tw-bg-iron-800/60" />
          <div className="tw-h-4 tw-w-3/4 tw-rounded tw-bg-iron-800/40" />
          <div className="tw-h-3 tw-w-full tw-rounded tw-bg-iron-800/30" />
          <div className="tw-h-3 tw-w-2/3 tw-rounded tw-bg-iron-800/20" />
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

function UnavailableOpenGraphPreview({
  href,
  effectiveHref,
  linkTarget,
  linkRel,
  variant,
  hideActions,
  domain,
  locale,
}: {
  readonly href: string;
  readonly effectiveHref: string;
  readonly linkTarget?: "_blank" | undefined;
  readonly linkRel?: string | undefined;
  readonly variant: LinkPreviewVariant;
  readonly hideActions: boolean;
  readonly domain?: string | null | undefined;
  readonly locale: SupportedLocale;
}) {
  if (variant === "home") {
    return (
      <LinkPreviewCardLayout
        href={href}
        variant={variant}
        hideActions={hideActions}
      >
        <Link
          href={effectiveHref}
          target={linkTarget}
          rel={linkRel}
          onClick={(e) => e.stopPropagation()}
          className="tw-relative tw-flex tw-h-full tw-w-full tw-items-end tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-no-underline"
          data-testid="og-preview-unavailable"
        >
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-iron-900/30 tw-via-black/20 tw-to-iron-900/30" />
          <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-flex-col tw-gap-1 tw-p-4">
            <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
              {t(locale, "linkPreview.unavailable")}
            </span>
            <span className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-100 tw-transition tw-duration-200 hover:tw-text-white">
              {wrapLongUnbrokenSegments(domain ?? href)}
            </span>
          </div>
        </Link>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={variant}
      hideActions={hideActions}
    >
      <div
        className="tw-flex tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6"
        data-testid="og-preview-unavailable"
      >
        <div className="tw-max-h-full tw-space-y-2 tw-overflow-y-auto tw-text-center">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-400">
            {t(locale, "linkPreview.unavailable")}
          </p>
          <Link
            href={effectiveHref}
            target={linkTarget}
            rel={linkRel}
            className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
          >
            {wrapLongUnbrokenSegments(domain ?? href)}
          </Link>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

function renderSpecializedOpenGraphPreview({
  commonProps,
  seizePreview,
  youtubePreview,
  farcasterEmbedPreview,
  externalFilePreview,
  allowFirstParty,
  firstPartyKind,
  imageUrl,
  title,
  domain,
  description,
  locale,
}: {
  readonly commonProps: RoutedPreviewCardProps;
  readonly seizePreview: SeizeCollectionLinkPreview | null;
  readonly youtubePreview: YoutubeVideoLinkPreview | null;
  readonly farcasterEmbedPreview: FarcasterEmbedLinkPreview | null;
  readonly externalFilePreview: ExternalFileLinkPreviewResponse | null;
  readonly allowFirstParty: boolean;
  readonly firstPartyKind: FirstPartyOpenGraphPreviewKind | null;
  readonly imageUrl: string | undefined;
  readonly title: string | undefined;
  readonly domain: string | undefined;
  readonly description: string | undefined;
  readonly locale: SupportedLocale;
}): ReactElement | null {
  if (seizePreview) {
    return (
      <SeizeCollectionPreviewCard
        {...commonProps}
        preview={seizePreview}
        locale={locale}
      />
    );
  }

  if (youtubePreview) {
    return (
      <YoutubeVideoPreviewCard
        {...commonProps}
        preview={youtubePreview}
        locale={locale}
      />
    );
  }

  if (farcasterEmbedPreview) {
    return (
      <FarcasterEmbedPreviewCard
        {...commonProps}
        preview={farcasterEmbedPreview}
        locale={locale}
      />
    );
  }

  if (externalFilePreview) {
    return (
      <ExternalFilePreviewCard
        {...commonProps}
        preview={externalFilePreview}
        locale={locale}
      />
    );
  }

  if (allowFirstParty && imageUrl && firstPartyKind) {
    return (
      <LinkPreviewCardLayout
        href={commonProps.href}
        variant={commonProps.variant}
        hideActions={commonProps.hideActions}
      >
        <FirstPartyOpenGraphPreviewCard
          effectiveHref={commonProps.effectiveHref}
          linkTarget={commonProps.linkTarget}
          linkRel={commonProps.linkRel}
          imageUrl={imageUrl}
          title={title ?? domain ?? commonProps.href}
          domain={domain}
          description={description}
          kind={firstPartyKind}
        />
      </LinkPreviewCardLayout>
    );
  }

  return null;
}

function DefaultOpenGraphPreviewContent({
  commonProps,
  githubPreview,
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
  readonly commonProps: RoutedPreviewCardProps;
  readonly githubPreview: GithubPreviewResponse | null;
  readonly imageUrl: string | undefined;
  readonly imageAlt: string | undefined;
  readonly faviconUrl: string | undefined;
  readonly title: string;
  readonly description: string | undefined;
  readonly domain: string | undefined;
  readonly mediaTypeLabel: string | undefined;
  readonly author: string | undefined;
  readonly publishedDate: string | undefined;
  readonly publishedDateTime: string | undefined;
  readonly locale: SupportedLocale;
}) {
  if (commonProps.variant === "home") {
    return (
      <Link
        href={commonProps.effectiveHref}
        target={commonProps.linkTarget}
        rel={commonProps.linkRel}
        onClick={(event) => event.stopPropagation()}
        className="tw-relative tw-block tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-t-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-no-underline"
        data-testid="og-preview-card"
      >
        {isGithubStatusPreviewResponse(githubPreview) && (
          <GithubPreviewStatusBadge
            href={commonProps.href}
            initialPreview={githubPreview}
            compact
          />
        )}
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="tw-object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 480px"
            unoptimized
          />
        )}
        <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-black tw-via-black/60 tw-to-black/5" />
        <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-flex-col tw-justify-end tw-gap-2 tw-p-4">
          {domain && (
            <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-200/80">
              {wrapLongUnbrokenSegments(domain)}
            </span>
          )}
          <span className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 tw-transition tw-duration-200 hover:tw-text-white">
            <span className="tw-line-clamp-1">
              {wrapLongUnbrokenSegments(title)}
            </span>
          </span>
          {description && (
            <p className="tw-[overflow-wrap:anywhere] tw-m-0 tw-line-clamp-1 tw-whitespace-pre-line tw-break-words tw-text-xs tw-text-iron-100/80">
              {wrapLongUnbrokenSegments(description)}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="tw-relative tw-h-full tw-min-h-0 tw-w-full">
      {isGithubStatusPreviewResponse(githubPreview) && (
        <GithubPreviewStatusBadge
          href={commonProps.href}
          initialPreview={githubPreview}
        />
      )}
      <GenericOpenGraphPreviewCard
        effectiveHref={commonProps.effectiveHref}
        linkTarget={commonProps.linkTarget}
        linkRel={commonProps.linkRel}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        faviconUrl={faviconUrl}
        title={title}
        description={description}
        domain={domain}
        mediaTypeLabel={mediaTypeLabel}
        author={author}
        publishedDate={publishedDate}
        publishedDateTime={publishedDateTime}
        locale={locale}
      />
    </div>
  );
}

export default function OpenGraphPreview({
  href,
  preview,
  variant,
  imageOnly = false,
  hideActions = false,
}: OpenGraphPreviewProps) {
  const contextVariant = useLinkPreviewVariant();
  const resolvedVariant = variant ?? contextVariant;
  const relativeHref = getRelativeHref(href);
  const effectiveHref = relativeHref ?? href;
  const isExternalLink = !relativeHref;
  const linkTarget = isExternalLink ? "_blank" : undefined;
  const linkRel = isExternalLink ? "noopener noreferrer" : undefined;
  const locale = DEFAULT_LOCALE;
  const commonProps = {
    href,
    effectiveHref,
    linkTarget,
    linkRel,
    variant: resolvedVariant,
    hideActions,
  } satisfies RoutedPreviewCardProps;

  if (preview === undefined) {
    return (
      <OpenGraphPreviewSkeleton
        href={href}
        variant={resolvedVariant}
        hideActions={hideActions}
      />
    );
  }

  const title = readFirstString(preview, TITLE_KEYS);
  const description = readFirstString(preview, DESCRIPTION_KEYS);
  const imageUrl = extractImageUrl(preview);
  const imageAlt = extractImageAlt(preview);
  const faviconUrl = extractFaviconUrl(preview);
  const domain = deriveDomain(href, preview);
  const author = readFirstString(preview, AUTHOR_KEYS);
  const publishedDateRaw = readFirstString(preview, PUBLISHED_TIME_KEYS);
  const publishedDate = formatPublishedDate(publishedDateRaw, locale);
  const publishedDateTime = getPublishedDateTime(publishedDateRaw);
  const mediaTypeLabel = normalizeMediaTypeLabel(
    readFirstString(preview, MEDIA_TYPE_KEYS),
    locale
  );
  const githubPreview = extractGithubPreview(preview);
  const externalFilePreview = extractExternalFilePreview(preview);
  const seizePreview = extractSeizeCollectionPreview(preview);
  const youtubePreview = extractYoutubeVideoPreview(preview);
  const farcasterEmbedPreview = extractFarcasterEmbedPreview(preview);
  const hasContent = Boolean(title ?? description ?? imageUrl);
  const firstPartyKind = getFirstPartyOgKindFromImageUrl(imageUrl);
  const displayTitle = title ?? domain ?? href;

  if (imageOnly && imageUrl) {
    return (
      <LinkPreviewCardLayout
        href={commonProps.href}
        variant={commonProps.variant}
        hideActions={commonProps.hideActions}
      >
        <Link
          href={commonProps.effectiveHref}
          target={commonProps.linkTarget}
          rel={commonProps.linkRel}
          onClick={(event) => event.stopPropagation()}
          className="tw-block tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-no-underline"
          data-testid="og-preview-card"
        >
          <div className="tw-relative tw-aspect-[16/9] tw-w-full tw-overflow-hidden tw-bg-iron-900/60">
            <Image
              src={imageUrl}
              alt={displayTitle}
              fill
              className="tw-object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 480px"
              unoptimized
            />
          </div>
        </Link>
      </LinkPreviewCardLayout>
    );
  }

  if (!hasContent) {
    return (
      <UnavailableOpenGraphPreview
        href={href}
        effectiveHref={effectiveHref}
        linkTarget={linkTarget}
        linkRel={linkRel}
        variant={resolvedVariant}
        hideActions={hideActions}
        domain={domain}
        locale={locale}
      />
    );
  }

  const specializedPreview = imageOnly
    ? null
    : renderSpecializedOpenGraphPreview({
        commonProps,
        seizePreview,
        youtubePreview,
        farcasterEmbedPreview,
        externalFilePreview,
        allowFirstParty: resolvedVariant !== "home",
        firstPartyKind,
        imageUrl,
        title,
        domain,
        description,
        locale,
      });
  if (specializedPreview) {
    return specializedPreview;
  }

  return (
    <LinkPreviewCardLayout
      href={commonProps.href}
      variant={commonProps.variant}
      hideActions={commonProps.hideActions}
    >
      <DefaultOpenGraphPreviewContent
        commonProps={commonProps}
        githubPreview={githubPreview}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        faviconUrl={faviconUrl}
        title={displayTitle}
        description={description}
        domain={domain}
        mediaTypeLabel={mediaTypeLabel}
        author={author}
        publishedDate={publishedDate}
        publishedDateTime={publishedDateTime}
        locale={locale}
      />
    </LinkPreviewCardLayout>
  );
}
