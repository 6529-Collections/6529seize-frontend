import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  FarcasterEmbedLinkPreview,
  SeizeCollectionLinkPreview,
  SeizeCollectionLiveMint,
  SeizeCollectionPreviewFact,
  SeizeCollectionPreviewPerson,
  SeizeCollectionPreviewTrait,
  YoutubeVideoLinkPreview,
} from "@/services/api/link-preview-api";
import type { LinkPreviewVariant } from "../LinkPreviewContext";
import {
  deriveDomain,
  extractImageAlt,
  extractImageUrl,
  FIRST_PARTY_OG_KIND_LABELS,
  wrapLongUnbrokenSegments,
} from "./core";
import {
  getHttpsHref,
  getTrustedYoutubeEmbedUrl,
  isExternalHref,
  LinkPreviewCardLayout,
} from "./cards";
import type { FirstPartyOpenGraphPreviewKind } from "./types";

function createLiveMintFact(
  liveMint: SeizeCollectionLiveMint | null,
  locale: SupportedLocale
): SeizeCollectionPreviewFact | null {
  if (!liveMint) {
    return null;
  }

  if (liveMint.mintedCount !== null && liveMint.mintedCount !== undefined) {
    const mintedCount = formatInteger(locale, liveMint.mintedCount);
    const value =
      liveMint.maxCount !== null && liveMint.maxCount !== undefined
        ? `${mintedCount} / ${formatInteger(locale, liveMint.maxCount)}`
        : mintedCount;

    return {
      label: t(locale, "linkPreview.collection.minted"),
      value,
    };
  }

  if (liveMint.maxCount !== null && liveMint.maxCount !== undefined) {
    return {
      label: t(locale, "linkPreview.collection.maximumEdition"),
      value: formatInteger(locale, liveMint.maxCount),
    };
  }

  return null;
}

export function FirstPartyOpenGraphPreviewCard({
  effectiveHref,
  linkTarget,
  linkRel,
  imageUrl,
  title,
  domain,
  description,
  kind,
}: {
  readonly effectiveHref: string;
  readonly linkTarget: "_blank" | undefined;
  readonly linkRel: string | undefined;
  readonly imageUrl: string;
  readonly title: string;
  readonly domain: string | undefined;
  readonly description: string | undefined;
  readonly kind: FirstPartyOpenGraphPreviewKind;
}) {
  const kindLabel = FIRST_PARTY_OG_KIND_LABELS[kind];

  return (
    <div
      className="tw-relative tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-3 sm:tw-p-4"
      data-testid="og-preview-card"
      data-og-kind={kind}
    >
      <div className="tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-gap-2 lg:tw-flex-row lg:tw-gap-3">
        <Link
          href={effectiveHref}
          target={linkTarget}
          rel={linkRel}
          className="tw-relative tw-block tw-h-28 tw-w-full tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-black/35 lg:tw-h-full lg:tw-w-72 xl:tw-w-80"
        >
          {/* Generated 6529 OG images are already complete cards; preserve them. */}
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="tw-object-contain"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 14rem, (max-width: 1024px) 18rem, 20rem"
            unoptimized
          />
        </Link>

        <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center tw-gap-y-1.5 tw-overflow-hidden">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            {domain && (
              <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                {wrapLongUnbrokenSegments(domain)}
              </span>
            )}
            <span className="tw-text-primary-200 tw-flex-shrink-0 tw-rounded-full tw-border tw-border-primary-400/35 tw-bg-primary-400/10 tw-px-2 tw-py-0.5 tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-wide">
              {kindLabel}
            </span>
          </div>

          <Link
            href={effectiveHref}
            target={linkTarget}
            rel={linkRel}
            className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
          >
            {wrapLongUnbrokenSegments(title)}
          </Link>

          {description && (
            <p className="tw-[overflow-wrap:anywhere] tw-m-0 tw-line-clamp-1 tw-whitespace-pre-line tw-break-words tw-text-sm tw-leading-snug tw-text-iron-300 sm:tw-line-clamp-2">
              {wrapLongUnbrokenSegments(description)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SeizeCollectionPreviewCard({
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
  readonly preview: SeizeCollectionLinkPreview;
  readonly effectiveHref: string;
  readonly linkTarget?: string | undefined;
  readonly linkRel?: string | undefined;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly hideActions?: boolean | undefined;
  readonly locale: SupportedLocale;
}) {
  const imageUrl = extractImageUrl(preview);
  const people: readonly SeizeCollectionPreviewPerson[] = Array.isArray(
    preview.people
  )
    ? preview.people
    : [];
  const facts: readonly SeizeCollectionPreviewFact[] = Array.isArray(
    preview.facts
  )
    ? preview.facts
    : [];
  const traits: readonly SeizeCollectionPreviewTrait[] = Array.isArray(
    preview.traits
  )
    ? preview.traits.slice(0, 3)
    : [];
  const resolvedVariant = variant ?? "chat";
  const isHome = resolvedVariant === "home";
  const liveMint: SeizeCollectionLiveMint | null = preview.liveMint ?? null;
  const liveMintFact = createLiveMintFact(liveMint, locale);
  const displayFacts = liveMintFact ? [liveMintFact, ...facts] : facts;

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={resolvedVariant}
      hideActions={hideActions}
    >
      <div
        className={[
          "tw-flex tw-h-full tw-min-h-0 tw-w-full tw-items-center tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-p-3",
          isHome
            ? "tw-border-white/10 tw-bg-black/30"
            : "tw-border-iron-700 tw-bg-iron-950/70",
          !isHome && !hideActions ? "tw-pr-12 sm:tw-pr-3" : "",
        ].join(" ")}
        data-testid="6529-collection-preview-card"
      >
        <div
          className={[
            "tw-grid tw-w-full tw-min-w-0 tw-items-center tw-gap-3 sm:tw-gap-4",
            imageUrl
              ? "tw-grid-cols-[5.5rem,minmax(0,1fr)] sm:tw-grid-cols-[6.75rem,minmax(0,1fr)] md:tw-grid-cols-[8.25rem,minmax(0,1fr)]"
              : "tw-grid-cols-1",
          ].join(" ")}
        >
          {imageUrl && (
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(e) => e.stopPropagation()}
              className="tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-black tw-bg-black tw-p-1 tw-no-underline tw-shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              data-testid="6529-collection-preview-image-frame"
            >
              <span className="tw-relative tw-block tw-h-full tw-w-full">
                <Image
                  src={imageUrl}
                  alt={preview.title}
                  fill
                  className="tw-object-contain"
                  loading="lazy"
                  sizes="(max-width: 640px) 5.5rem, (max-width: 768px) 6.75rem, 8.25rem"
                  unoptimized
                />
              </span>
            </Link>
          )}
          <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center tw-gap-1.5 tw-overflow-hidden md:tw-gap-2">
            {preview.kicker && (
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
                <div className="tw-[overflow-wrap:anywhere] tw-line-clamp-1 tw-min-w-0 tw-break-words tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                  {wrapLongUnbrokenSegments(preview.kicker)}
                </div>
                {liveMint && (
                  <span className="tw-inline-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-emerald-400/30 tw-bg-emerald-500/10 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-leading-4 tw-text-emerald-200">
                    <span
                      aria-hidden="true"
                      className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-emerald-400"
                    />
                    {t(locale, "linkPreview.collection.mintingLive")}
                  </span>
                )}
              </div>
            )}
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(e) => e.stopPropagation()}
              className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white md:tw-text-lg"
            >
              {wrapLongUnbrokenSegments(preview.title)}
            </Link>
            {people.length > 0 && (
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-overflow-hidden tw-text-xs tw-leading-5 md:tw-text-sm">
                {people.map((person) => {
                  const personHref = person.href ?? undefined;
                  const personIsExternal = isExternalHref(personHref);

                  return (
                    <span
                      key={`${person.label ?? "person"}-${person.name}-${person.href ?? "display"}`}
                      className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-baseline tw-gap-1"
                    >
                      {person.label && (
                        <span className="tw-flex-shrink-0 tw-text-iron-500">
                          {person.label}
                        </span>
                      )}
                      {personHref ? (
                        <Link
                          href={personHref}
                          target={personIsExternal ? "_blank" : undefined}
                          rel={
                            personIsExternal ? "noopener noreferrer" : undefined
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="tw-truncate tw-font-medium tw-text-iron-200 tw-no-underline hover:tw-text-white"
                        >
                          {person.name}
                        </Link>
                      ) : (
                        <span className="tw-truncate tw-font-medium tw-text-iron-200">
                          {person.name}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
            {displayFacts.length > 0 && (
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5 tw-overflow-hidden">
                {displayFacts.map((fact) => (
                  <span
                    key={`${fact.label}-${fact.value}`}
                    className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/75 tw-px-2 tw-py-0.5 tw-text-[11px] tw-leading-5"
                  >
                    <span className="tw-flex-shrink-0 tw-text-iron-400">
                      {fact.label}
                    </span>
                    <span className="tw-truncate tw-font-medium tw-text-iron-100">
                      {fact.value}
                    </span>
                  </span>
                ))}
              </div>
            )}
            {traits.length > 0 && (
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5 tw-overflow-hidden">
                {traits.map((trait) => (
                  <span
                    key={`${trait.label}-${trait.value}`}
                    className="tw-inline-flex tw-max-w-full tw-rounded-md tw-bg-emerald-500/10 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-leading-5 tw-text-emerald-100"
                  >
                    <span className="tw-truncate">
                      {trait.label}: {trait.value}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

export function FarcasterEmbedPreviewCard({
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
  readonly preview: FarcasterEmbedLinkPreview;
  readonly effectiveHref: string;
  readonly linkTarget?: "_blank" | undefined;
  readonly linkRel?: string | undefined;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly hideActions?: boolean | undefined;
  readonly locale: SupportedLocale;
}) {
  const resolvedVariant = variant ?? "chat";
  const isHome = resolvedVariant === "home";
  const isMiniApp = preview.embedKind === "miniapp";
  const title =
    (preview.embedKind === "legacy-frame"
      ? preview.title?.trim() || preview.appName?.trim()
      : preview.appName?.trim() || preview.title?.trim()) ||
    t(locale, "linkPreview.farcaster.titleFallback");
  const imageUrl = preview.imageUrl ?? extractImageUrl(preview);
  const imageAlt =
    extractImageAlt(preview) ??
    (title
      ? t(locale, "linkPreview.farcaster.imageAlt", { title })
      : t(locale, "linkPreview.farcaster.imageFallbackAlt"));
  const badgeLabel = isMiniApp
    ? t(locale, "linkPreview.farcaster.miniAppBadge")
    : t(locale, "linkPreview.farcaster.frameBadge");
  const ctaLabel =
    preview.buttonTitle?.trim() ||
    (isMiniApp
      ? t(locale, "linkPreview.farcaster.openMiniApp")
      : t(locale, "linkPreview.farcaster.openFrame"));
  const actionHref = getHttpsHref(preview.actionUrl) ?? effectiveHref;
  const sourceLabel =
    preview.siteName?.trim() ||
    preview.source?.trim() ||
    deriveDomain(href, preview);
  // The API normalizes this to #rrggbb before it reaches the client.
  const splashColor = preview.splashBackgroundColor ?? "#855dcd";
  const mediaSizes = isHome
    ? "(max-width: 768px) 100vw, 480px"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 13rem, 15rem";

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={resolvedVariant}
      hideActions={hideActions}
    >
      <div
        className={[
          "tw-relative tw-flex tw-h-full tw-min-h-0 tw-w-full tw-rounded-xl tw-border tw-border-solid tw-bg-iron-950/80 tw-shadow-sm tw-shadow-black/20",
          isHome
            ? "tw-overflow-hidden"
            : "tw-overflow-y-auto tw-overflow-x-hidden",
          isHome ? "tw-border-white/10" : "tw-border-iron-700",
          !isHome && !hideActions ? "tw-pr-12 sm:tw-pr-14" : "",
        ].join(" ")}
        data-testid="farcaster-embed-preview-card"
      >
        <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-bg-[#855dcd]" />
        <div
          className={[
            "tw-grid tw-w-full tw-min-w-0 tw-items-center tw-gap-3 tw-p-3 sm:tw-gap-4",
            isHome ? "tw-h-full" : "tw-min-h-full",
            isHome
              ? "tw-grid-cols-1"
              : "tw-grid-cols-1 sm:tw-grid-cols-[minmax(9.5rem,13rem),minmax(0,1fr)]",
          ].join(" ")}
          data-testid="farcaster-embed-preview-content"
        >
          <Link
            href={actionHref}
            target={linkTarget}
            rel={linkRel}
            onClick={(event) => event.stopPropagation()}
            className="tw-relative tw-block tw-aspect-[3/2] tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-black tw-bg-black tw-no-underline"
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="tw-object-cover tw-transition tw-duration-300 hover:tw-scale-[1.02]"
                loading="lazy"
                sizes={mediaSizes}
                unoptimized
              />
            ) : (
              <span
                aria-hidden="true"
                className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-[#855dcd]/40 tw-via-black tw-to-iron-950"
              />
            )}
            <span className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-16 tw-bg-gradient-to-t tw-from-black/70 tw-to-transparent" />
            <span
              aria-hidden="true"
              className="tw-absolute tw-bottom-2 tw-left-2 tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-md tw-bg-black/70 tw-px-2 tw-py-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-4 tw-text-white"
            >
              <span
                aria-hidden="true"
                className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-[#855dcd]"
              />
              {badgeLabel}
            </span>
          </Link>

          <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-col tw-justify-center tw-gap-2 tw-overflow-hidden">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
              {preview.splashImageUrl && (
                <span
                  className="tw-relative tw-h-7 tw-w-7 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/10"
                  style={{ backgroundColor: splashColor }}
                  aria-hidden="true"
                >
                  <Image
                    src={preview.splashImageUrl}
                    alt=""
                    fill
                    className="tw-object-cover"
                    loading="lazy"
                    sizes="1.75rem"
                    unoptimized
                  />
                </span>
              )}
              <span className="tw-flex-shrink-0 tw-rounded-md tw-border tw-border-[#855dcd]/30 tw-bg-[#855dcd]/15 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-4 tw-text-purple-100">
                {badgeLabel}
              </span>
              {sourceLabel && (
                <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                  {sourceLabel}
                </span>
              )}
            </div>
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(event) => event.stopPropagation()}
              className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white md:tw-text-lg"
            >
              {wrapLongUnbrokenSegments(title)}
            </Link>
            {preview.description && (
              <p className="tw-[overflow-wrap:anywhere] tw-m-0 tw-line-clamp-2 tw-whitespace-pre-line tw-break-words tw-text-sm tw-leading-5 tw-text-iron-300">
                {wrapLongUnbrokenSegments(preview.description)}
              </p>
            )}
            <Link
              href={actionHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(event) => event.stopPropagation()}
              className="tw-inline-flex tw-w-fit tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/75 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-200 tw-no-underline tw-transition tw-duration-200 hover:tw-border-[#855dcd]/50 hover:tw-text-white"
            >
              <span className="tw-h-1.5 tw-w-1.5 tw-flex-shrink-0 tw-rounded-full tw-bg-[#855dcd]" />
              <span className="tw-truncate">{ctaLabel}</span>
            </Link>
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

function getYoutubeThumbnailAlt({
  preview,
  rawTitle,
  locale,
}: {
  readonly preview: YoutubeVideoLinkPreview;
  readonly rawTitle: string;
  readonly locale: SupportedLocale;
}): string {
  const imageAlt = extractImageAlt(preview);
  if (imageAlt) {
    return imageAlt;
  }

  if (rawTitle) {
    return t(locale, "linkPreview.youtube.thumbnailAlt", { title: rawTitle });
  }

  return t(locale, "linkPreview.youtube.thumbnailFallbackAlt");
}

function getYoutubeAuthor(
  preview: YoutubeVideoLinkPreview
): string | undefined {
  const rawAuthor = preview.authorName ?? preview.author;
  if (typeof rawAuthor !== "string") {
    return undefined;
  }

  const author = rawAuthor.trim();
  return author.length > 0 ? author : undefined;
}

function getYoutubeProviderLabel(
  preview: YoutubeVideoLinkPreview,
  locale: SupportedLocale
): string {
  if (typeof preview.provider === "string") {
    const provider = preview.provider.trim();
    if (provider.length > 0) {
      return provider;
    }
  }

  return t(locale, "linkPreview.youtube.providerFallback");
}

function YoutubeThumbnailBackdrop({
  thumbnailUrl,
  thumbnailAlt,
  mediaSizes,
  isInteractive,
}: {
  readonly thumbnailUrl: string | undefined;
  readonly thumbnailAlt: string;
  readonly mediaSizes: string;
  readonly isInteractive: boolean;
}) {
  if (!thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-iron-900 tw-via-black tw-to-iron-950"
      />
    );
  }

  return (
    <Image
      src={thumbnailUrl}
      alt={thumbnailAlt}
      fill
      className={
        isInteractive
          ? "tw-object-cover tw-transition tw-duration-300 group-hover/youtube-play:tw-scale-[1.02]"
          : "tw-object-cover"
      }
      loading="lazy"
      sizes={mediaSizes}
      unoptimized
    />
  );
}

function YoutubeVideoMedia({
  isPlaying,
  trustedEmbedUrl,
  thumbnailUrl,
  thumbnailAlt,
  mediaSizes,
  title,
  locale,
  onPlay,
  watchHref,
  linkTarget,
  linkRel,
}: {
  readonly isPlaying: boolean;
  readonly trustedEmbedUrl: string | undefined;
  readonly thumbnailUrl: string | undefined;
  readonly thumbnailAlt: string;
  readonly mediaSizes: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly onPlay: () => void;
  readonly watchHref: string;
  readonly linkTarget: "_blank" | undefined;
  readonly linkRel: string | undefined;
}) {
  if (isPlaying && trustedEmbedUrl) {
    return (
      <iframe
        className="tw-absolute tw-inset-0 tw-h-full tw-w-full"
        src={trustedEmbedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        data-testid="youtube-video-embed"
      />
    );
  }

  if (trustedEmbedUrl) {
    return (
      <button
        type="button"
        aria-label={t(locale, "linkPreview.youtube.playVideo", {
          title,
        })}
        className="tw-group/youtube-play tw-relative tw-block tw-h-full tw-w-full tw-overflow-hidden tw-border-0 tw-bg-black tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        onClick={(event) => {
          event.stopPropagation();
          onPlay();
        }}
        data-testid="youtube-video-play"
      >
        <YoutubeThumbnailBackdrop
          thumbnailUrl={thumbnailUrl}
          thumbnailAlt={thumbnailAlt}
          mediaSizes={mediaSizes}
          isInteractive
        />
        <span className="tw-absolute tw-inset-0 tw-bg-black/20 tw-transition tw-duration-200 group-hover/youtube-play:tw-bg-black/10" />
        <span
          aria-hidden="true"
          className="tw-bg-red-600 tw-absolute tw-left-1/2 tw-top-1/2 tw-flex tw-h-12 tw-w-12 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-shadow-lg tw-shadow-black/30 tw-transition tw-duration-200 group-hover/youtube-play:tw-scale-105"
        >
          <span className="tw-ml-1 tw-block tw-h-0 tw-w-0 tw-border-y-[8px] tw-border-l-[13px] tw-border-y-transparent tw-border-l-white" />
        </span>
      </button>
    );
  }

  return (
    <Link
      href={watchHref}
      target={linkTarget}
      rel={linkRel}
      onClick={(event) => event.stopPropagation()}
      className="tw-relative tw-block tw-h-full tw-w-full tw-overflow-hidden tw-no-underline"
    >
      <YoutubeThumbnailBackdrop
        thumbnailUrl={thumbnailUrl}
        thumbnailAlt={thumbnailAlt}
        mediaSizes={mediaSizes}
        isInteractive={false}
      />
    </Link>
  );
}

export function YoutubeVideoPreviewCard({
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
  readonly preview: YoutubeVideoLinkPreview;
  readonly effectiveHref: string;
  readonly linkTarget?: "_blank" | undefined;
  readonly linkRel?: string | undefined;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly hideActions?: boolean | undefined;
  readonly locale: SupportedLocale;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const resolvedVariant = variant ?? "chat";
  const isHome = resolvedVariant === "home";
  const rawTitle = preview.title?.trim() ?? "";
  const title = rawTitle || t(locale, "linkPreview.youtube.titleFallback");
  const thumbnailUrl = preview.thumbnailUrl ?? undefined;
  const trustedEmbedUrl = getTrustedYoutubeEmbedUrl(preview.embedUrl);
  const thumbnailAlt = getYoutubeThumbnailAlt({
    preview,
    rawTitle,
    locale,
  });
  const author = getYoutubeAuthor(preview);
  const watchLabel = t(locale, "linkPreview.youtube.watchOnYoutube");
  const providerLabel = getYoutubeProviderLabel(preview, locale);
  const watchHref = preview.watchUrl || effectiveHref;
  const mediaSizes = isHome
    ? "(max-width: 768px) 100vw, 480px"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 14rem, 16rem";

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={resolvedVariant}
      hideActions={hideActions}
    >
      <div
        className={[
          "tw-relative tw-flex tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-bg-iron-950/80 tw-shadow-sm tw-shadow-black/20",
          isHome ? "tw-border-white/10" : "tw-border-iron-700",
          !isHome && !hideActions ? "tw-pr-12 sm:tw-pr-14" : "",
        ].join(" ")}
        data-testid="youtube-video-preview-card"
      >
        <span className="tw-bg-red-500/80 tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-1" />
        <div
          className={[
            "tw-grid tw-h-full tw-w-full tw-min-w-0 tw-items-center tw-gap-3 tw-p-3 sm:tw-gap-4",
            isHome
              ? "tw-grid-cols-1"
              : "tw-grid-cols-1 sm:tw-grid-cols-[minmax(10rem,14rem),minmax(0,1fr)]",
          ].join(" ")}
        >
          <div className="tw-relative tw-aspect-video tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-black tw-bg-black">
            <YoutubeVideoMedia
              isPlaying={isPlaying}
              trustedEmbedUrl={trustedEmbedUrl}
              thumbnailUrl={thumbnailUrl}
              thumbnailAlt={thumbnailAlt}
              mediaSizes={mediaSizes}
              title={title}
              locale={locale}
              onPlay={() => setIsPlaying(true)}
              watchHref={watchHref}
              linkTarget={linkTarget}
              linkRel={linkRel}
            />
          </div>

          <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-col tw-justify-center tw-gap-1.5 tw-overflow-hidden">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
              <span className="tw-border-red-500/25 tw-bg-red-500/10 tw-text-red-100 tw-flex-shrink-0 tw-rounded-md tw-border tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-4">
                {providerLabel}
              </span>
              {author && (
                <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                  {t(locale, "linkPreview.byline", { author })}
                </span>
              )}
            </div>
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(event) => event.stopPropagation()}
              className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white md:tw-text-lg"
            >
              {wrapLongUnbrokenSegments(title)}
            </Link>
            <Link
              href={watchHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(event) => event.stopPropagation()}
              className="hover:tw-border-red-500/40 tw-inline-flex tw-w-fit tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/75 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-200 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
            >
              <span className="tw-bg-red-500 tw-h-1.5 tw-w-1.5 tw-flex-shrink-0 tw-rounded-full" />
              <span className="tw-truncate">{watchLabel}</span>
            </Link>
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}
