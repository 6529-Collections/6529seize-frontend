"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  fetchWikimediaCard,
  type WikimediaArticleCard,
  type WikimediaCardResponse,
  type WikimediaCommonsFileCard,
  type WikimediaDisambiguationCard,
  type WikimediaSource,
  type WikimediaUnavailableCard,
  type WikimediaWikidataCard,
} from "@/services/api/wikimedia-card";

import { LinkPreviewCardLayout } from "./OpenGraphPreview";

interface WikimediaCardProps {
  readonly href: string;
}

type CardState =
  | { readonly type: "loading" }
  | { readonly type: "loaded"; readonly data: WikimediaCardResponse }
  | { readonly type: "error" };

const SOURCE_LABEL: Record<WikimediaSource, string> = {
  wikipedia: "Wikipedia",
  "wikimedia-commons": "Wikimedia Commons",
  wikidata: "Wikidata",
};

const PRIMARY_ACTION_LABEL: Record<WikimediaSource, string> = {
  wikipedia: "Open on Wikipedia",
  "wikimedia-commons": "Open on Commons",
  wikidata: "Open on Wikidata",
};

const formatCoordinate = (
  value: number,
  positive: string,
  negative: string
): string => {
  const suffix = value >= 0 ? positive : negative;
  const magnitude = Math.abs(value);
  return `${magnitude.toFixed(2)}° ${suffix}`;
};

const formatCoordinates = (
  coords: NonNullable<WikimediaArticleCard["coordinates"]>
): string => {
  return `${formatCoordinate(coords.lat, "N", "S")}, ${formatCoordinate(coords.lon, "E", "W")}`;
};

const renderSourceAttribution = (source: WikimediaSource, url: string) => (
  <div className="tw-mt-4 tw-text-xs tw-text-iron-400">
    Source:{" "}
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-text-xs tw-font-semibold tw-text-iron-200 tw-underline tw-underline-offset-2 hover:tw-text-white"
    >
      {SOURCE_LABEL[source]}
    </Link>
  </div>
);

const renderArticleCard = (data: WikimediaArticleCard) => {
  const { thumbnail, title, description, extract, lang, coordinates, section } =
    data;

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
        {thumbnail?.url && (
          <Link
            href={data.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-block md:tw-w-60 md:tw-flex-shrink-0"
          >
            <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60">
              <Image
                src={thumbnail.url}
                alt={title}
                width={thumbnail.width ?? 600}
                height={thumbnail.height ?? 400}
                className="tw-h-full tw-w-full tw-object-cover"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 100vw, 240px"
                unoptimized
              />
            </div>
          </Link>
        )}
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-3">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <span className="tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-100">
              {title}
            </span>
            <span className="tw-rounded-full tw-bg-iron-800/80 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-200">
              {lang}
            </span>
            {section && (
              <span className="tw-rounded-full tw-bg-iron-800/50 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-200">
                Section: {section}
              </span>
            )}
            {coordinates && (
              <span className="tw-rounded-full tw-bg-iron-800/50 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-200">
                📍 {formatCoordinates(coordinates)}
              </span>
            )}
          </div>
          <div className="tw-space-y-2" lang={lang}>
            {description && (
              <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
                {description}
              </p>
            )}
            {extract && (
              <p className="tw-m-0 tw-line-clamp-3 tw-text-sm tw-leading-relaxed tw-text-iron-300">
                {extract}
              </p>
            )}
          </div>
          {renderSourceAttribution(data.source, data.pageUrl)}
        </div>
      </div>
    </div>
  );
};

const renderDisambiguationCard = (data: WikimediaDisambiguationCard) => {
  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-y-3">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span className="tw-text-lg tw-font-semibold tw-text-iron-100">
            {data.title}
          </span>
          <span className="tw-rounded-full tw-bg-iron-800/80 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-200">
            {data.lang}
          </span>
          <span className="tw-rounded-full tw-bg-amber-500/10 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-amber-300">
            Disambiguation
          </span>
          {data.section && (
            <span className="tw-rounded-full tw-bg-iron-800/50 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-200">
              Section: {data.section}
            </span>
          )}
        </div>
        {(data.description || data.extract) && (
          <div className="tw-space-y-2" lang={data.lang}>
            {data.description && (
              <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
                {data.description}
              </p>
            )}
            {data.extract && (
              <p className="tw-m-0 tw-text-sm tw-text-iron-300">
                {data.extract}
              </p>
            )}
          </div>
        )}
        <div className="tw-space-y-2">
          {data.items.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800/60 tw-bg-iron-900/40 tw-p-3 tw-no-underline hover:tw-border-iron-600"
            >
              {item.thumbnail?.url && (
                <div className="tw-h-12 tw-w-12 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-900/60">
                  <Image
                    src={item.thumbnail.url}
                    alt={item.title}
                    width={item.thumbnail.width ?? 120}
                    height={item.thumbnail.height ?? 120}
                    className="tw-h-full tw-w-full tw-object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="48px"
                    unoptimized
                  />
                </div>
              )}
              <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
                <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
                  {item.title}
                </span>
                {item.description && (
                  <span className="tw-line-clamp-2 tw-text-xs tw-text-iron-300">
                    {item.description}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
        {renderSourceAttribution(data.source, data.pageUrl)}
      </div>
    </div>
  );
};

const renderCommonsCard = (data: WikimediaCommonsFileCard) => {
  const creditText = data.credit ?? data.author ?? undefined;
  const licenseName = data.license?.name ?? undefined;

  return (
    <div className="tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
      {data.thumbnail?.url && (
        <Link
          href={data.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-block"
        >
          <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60">
            <Image
              src={data.thumbnail.url}
              alt={data.description ?? data.title}
              width={data.thumbnail.width ?? 1200}
              height={data.thumbnail.height ?? 800}
              className="tw-h-full tw-w-full tw-bg-iron-900 tw-object-contain"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 480px"
              unoptimized
            />
          </div>
        </Link>
      )}
      <div className="tw-space-y-2">
        <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {data.title}
        </h3>
        {data.description && (
          <p className="tw-m-0 tw-text-sm tw-leading-relaxed tw-text-iron-300">
            {data.description}
          </p>
        )}
      </div>
      <div className="tw-space-y-1 tw-text-xs tw-text-iron-300">
        {creditText && <div>Photo: {creditText}</div>}
        {licenseName && (
          <div>
            License:{" "}
            {data.license?.url ? (
              <Link
                href={data.license.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-text-xs tw-font-semibold tw-text-iron-200 tw-underline hover:tw-text-white"
              >
                {licenseName}
              </Link>
            ) : (
              <span>{licenseName}</span>
            )}
            {data.license?.requiresAttribution
              ? " (attribution required)"
              : null}
          </div>
        )}
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-3">
        <Link
          href={data.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-2 hover:tw-text-primary-300"
        >
          Open on Commons
        </Link>
        {data.original?.url && (
          <Link
            href={data.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-2 hover:tw-text-primary-300"
          >
            View original
          </Link>
        )}
      </div>
      {renderSourceAttribution(data.source, data.pageUrl)}
    </div>
  );
};

const renderWikidataCard = (data: WikimediaWikidataCard) => {
  return (
    <div className="tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {data.title}
        </h3>
        <span className="tw-rounded-full tw-bg-iron-800/80 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-200">
          Wikidata
        </span>
      </div>
      {data.description && (
        <p
          className="tw-m-0 tw-text-sm tw-leading-relaxed tw-text-iron-300"
          lang={data.lang}
        >
          {data.description}
        </p>
      )}
      {data.image?.url && (
        <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60">
          <Image
            src={data.image.url}
            alt={data.image.alt ?? data.title}
            width={data.image.width ?? 1200}
            height={data.image.height ?? 800}
            className="tw-h-full tw-w-full tw-bg-iron-900 tw-object-contain"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 360px"
            unoptimized
          />
        </div>
      )}
      {data.facts.length > 0 && (
        <dl className="tw-grid tw-grid-cols-1 tw-gap-y-3">
          {data.facts.map((fact) => (
            <div
              key={`${fact.propertyId}-${fact.value}`}
              className="tw-flex tw-flex-col tw-gap-1"
            >
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                {fact.propertyLabel}
              </dt>
              <dd className="tw-m-0 tw-text-sm tw-text-iron-200">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {data.sitelinks.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-gap-3">
          {data.sitelinks.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-2 hover:tw-text-primary-300"
            >
              {link.title}
            </Link>
          ))}
        </div>
      )}
      {renderSourceAttribution(data.source, data.pageUrl)}
    </div>
  );
};

const renderUnavailableCard = (
  data: WikimediaUnavailableCard,
  actionLabel: string
) => {
  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6">
      <div className="tw-space-y-3 tw-text-center">
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
          This page is unavailable.
        </p>
        <Link
          href={data.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline tw-transition hover:tw-border-primary-300/60 hover:tw-text-white"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
};

const renderSkeleton = (href: string) => (
  <LinkPreviewCardLayout href={href}>
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
      <div className="tw-animate-pulse tw-space-y-3">
        <div className="tw-h-5 tw-w-1/2 tw-rounded tw-bg-iron-800/60" />
        <div className="tw-h-3 tw-w-3/4 tw-rounded tw-bg-iron-800/40" />
        <div className="tw-h-3 tw-w-5/6 tw-rounded tw-bg-iron-800/30" />
        <div className="tw-h-32 tw-w-full tw-rounded-lg tw-bg-iron-800/20" />
      </div>
    </div>
  </LinkPreviewCardLayout>
);

export default function WikimediaCard({ href }: WikimediaCardProps) {
  const [state, setState] = useState<CardState>({ type: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ type: "loading" });

    fetchWikimediaCard(href, controller.signal)
      .then((data) => {
        setState({ type: "loaded", data });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setState({ type: "error" });
      });

    return () => {
      controller.abort();
    };
  }, [href]);

  const card = state.type === "loaded" ? state.data : null;
  const layoutHref = card ? card.pageUrl : href;
  const actionLabel = card ? PRIMARY_ACTION_LABEL[card.source] : null;

  const content = useMemo(() => {
    if (!card || !actionLabel) {
      return null;
    }

    switch (card.kind) {
      case "article":
        return renderArticleCard(card);
      case "disambiguation":
        return renderDisambiguationCard(card);
      case "commons-file":
        return renderCommonsCard(card);
      case "wikidata":
        return renderWikidataCard(card);
      case "unavailable":
        return renderUnavailableCard(card, actionLabel);
      default:
        return null;
    }
  }, [card, actionLabel]);

  if (state.type === "loading") {
    return renderSkeleton(href);
  }

  if (state.type === "error") {
    return (
      <LinkPreviewCardLayout href={layoutHref}>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6">
          <div className="tw-space-y-2 tw-text-center">
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
              Unable to load preview
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">
              Try opening the link directly on Wikimedia.
            </p>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (!card || !content) {
    return (
      <LinkPreviewCardLayout href={layoutHref}>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6">
          <div className="tw-space-y-2 tw-text-center">
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
              Preview unavailable
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">
              Try opening the link directly on Wikimedia.
            </p>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout href={layoutHref}>{content}</LinkPreviewCardLayout>
  );
}
