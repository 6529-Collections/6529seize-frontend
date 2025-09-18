"use client";

import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";

import ChatItemHrefButtons from "../ChatItemHrefButtons";

import type {
  WikimediaArticlePreview,
  WikimediaCommonsPreview,
  WikimediaDisambiguationPreview,
  WikimediaPreview,
  WikimediaSource,
  WikimediaWikidataPreview,
} from "@/types/wikimedia";

const ACTION_BUTTON_CLASS =
  "tw-inline-flex tw-items-center tw-rounded-md tw-bg-primary-500/10 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-primary-200 tw-transition hover:tw-bg-primary-500/20 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

const BADGE_CLASS =
  "tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-200";

const SectionBadge = ({ section }: { section: string }) => (
  <span className={`${BADGE_CLASS}`}>{`Section: ${section}`}</span>
);

const SourceLabel = ({ source }: { source: WikimediaSource }) => {
  switch (source) {
    case "commons":
      return "Wikimedia Commons";
    case "wikidata":
      return "Wikidata";
    default:
      return "Wikipedia";
  }
};

const LoadingSkeleton = ({ href }: { href: string }) => (
  <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
    <div className="tw-flex-1 tw-min-w-0">
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <div className="tw-animate-pulse tw-space-y-3">
          <div className="tw-h-5 tw-w-1/3 tw-rounded tw-bg-iron-800/60" />
          <div className="tw-h-4 tw-w-1/2 tw-rounded tw-bg-iron-800/50" />
          <div className="tw-h-3 tw-w-full tw-rounded tw-bg-iron-800/40" />
          <div className="tw-h-3 tw-w-2/3 tw-rounded tw-bg-iron-800/30" />
        </div>
      </div>
    </div>
    <ChatItemHrefButtons href={href} />
  </div>
);

const ErrorFallback = ({ href }: { href: string }) => (
  <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
    <div className="tw-flex-1 tw-min-w-0">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="tw-flex tw-h-full tw-w-full tw-flex-col tw-justify-center tw-gap-y-1 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-text-left tw-no-underline tw-transition-colors tw-duration-200 hover:tw-border-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          Open link
        </span>
        <span className="tw-text-xs tw-text-iron-400 tw-break-all">{href}</span>
      </a>
    </div>
    <ChatItemHrefButtons href={href} />
  </div>
);

const ActionLink = ({
  href,
  children,
  external = true,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer nofollow" : undefined}
    className={ACTION_BUTTON_CLASS}
  >
    {children}
  </a>
);

const ArticleCard = ({ preview }: { preview: WikimediaArticlePreview }) => {
  const { thumbnail, title, description, extract, canonicalUrl, coordinates, section, lang } = preview;
  const coordsLabel = useMemo(() => {
    if (!coordinates) {
      return null;
    }
    const lat = coordinates.lat.toFixed(2);
    const lon = coordinates.lon.toFixed(2);
    return `${lat}°, ${lon}°`;
  }, [coordinates]);

  return (
    <article className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4" lang={lang}>
      <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
        {thumbnail?.url && (
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-block md:tw-w-56 md:tw-flex-shrink-0"
          >
            <img
              src={thumbnail.url}
              alt={thumbnail.alt ?? title}
              width={thumbnail.width ?? 400}
              height={thumbnail.height ?? 300}
              loading="lazy"
              decoding="async"
              className="tw-h-full tw-w-full tw-rounded-lg tw-object-cover tw-bg-iron-900/60"
            />
          </a>
        )}
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-2">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              <SourceLabel source="wikipedia" />
            </span>
            <span className={BADGE_CLASS}>{preview.lang}</span>
            {section ? <SectionBadge section={section} /> : null}
            {coordsLabel ? <span className={BADGE_CLASS}>{coordsLabel}</span> : null}
          </div>
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-100 tw-no-underline tw-transition-colors tw-duration-200 hover:tw-text-white"
          >
            {title}
          </a>
          {description ? (
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">{description}</p>
          ) : null}
          {extract ? (
            <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-line-clamp-3 tw-whitespace-pre-line">
              {extract}
            </p>
          ) : null}
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-pt-2">
            <ActionLink href={canonicalUrl}>Open on Wikipedia</ActionLink>
            <span className="tw-text-xs tw-text-iron-400">
              Source: <a href={canonicalUrl} className="tw-underline" target="_blank" rel="noopener noreferrer">Wikipedia</a>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

const DisambiguationCard = ({
  preview,
}: {
  preview: WikimediaDisambiguationPreview;
}) => {
  const { canonicalUrl, items, title, description, extract, section, lang } = preview;

  return (
    <article className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4" lang={lang}>
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
            <SourceLabel source="wikipedia" />
          </span>
          <span className={BADGE_CLASS}>Disambiguation</span>
          {section ? <SectionBadge section={section} /> : null}
        </div>
        <a
          href={canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-100 tw-no-underline tw-transition-colors tw-duration-200 hover:tw-text-white"
        >
          {title}
        </a>
        {description ? (
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">{description}</p>
        ) : null}
        {extract ? (
          <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-whitespace-pre-line">
            {extract}
          </p>
        ) : null}
        <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
          {items.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-iron-900/40 tw-p-2 tw-no-underline tw-transition hover:tw-bg-iron-900/60"
              >
                {item.thumbnail?.url ? (
                  <img
                    src={item.thumbnail.url}
                    alt={item.title}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="tw-h-12 tw-w-12 tw-rounded-md tw-object-cover tw-bg-iron-900/40"
                  />
                ) : (
                  <div className="tw-h-12 tw-w-12 tw-rounded-md tw-bg-iron-900/60" />
                )}
                <div className="tw-min-w-0 tw-flex-1">
                  <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100 tw-truncate">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="tw-m-0 tw-text-xs tw-text-iron-300 tw-truncate">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </a>
            </li>
          ))}
        </ul>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <ActionLink href={canonicalUrl}>Open on Wikipedia</ActionLink>
          <span className="tw-text-xs tw-text-iron-400">
            Source: <a href={canonicalUrl} className="tw-underline" target="_blank" rel="noopener noreferrer">Wikipedia</a>
          </span>
        </div>
      </div>
    </article>
  );
};

const CommonsCard = ({ preview }: { preview: WikimediaCommonsPreview }) => {
  const { canonicalUrl, title, description, credit, license, thumbnail, originalFile } = preview;

  return (
    <article className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-4">
        {thumbnail?.url ? (
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-block"
          >
            <img
              src={thumbnail.url}
              alt={thumbnail.alt ?? title}
              width={thumbnail.width ?? 600}
              height={thumbnail.height ?? 400}
              loading="lazy"
              decoding="async"
              className="tw-w-full tw-rounded-lg tw-object-cover tw-bg-iron-900/60"
            />
          </a>
        ) : null}
        <div className="tw-space-y-2">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              <SourceLabel source="commons" />
            </span>
          </div>
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-100 tw-no-underline tw-transition-colors tw-duration-200 hover:tw-text-white"
          >
            {title}
          </a>
          {description ? (
            <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-whitespace-pre-line">
              {description}
            </p>
          ) : null}
          {credit ? (
            <p className="tw-m-0 tw-text-xs tw-text-iron-300">{credit}</p>
          ) : null}
          {license ? (
            <p className="tw-m-0 tw-text-xs tw-text-iron-300">
              License: {license.url ? (
                <a href={license.url} target="_blank" rel="noopener noreferrer" className="tw-underline">
                  {license.name}
                </a>
              ) : (
                license.name
              )}
            </p>
          ) : null}
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <ActionLink href={canonicalUrl}>Open on Commons</ActionLink>
          {originalFile?.url ? (
            <ActionLink href={originalFile.url}>View original</ActionLink>
          ) : null}
          <span className="tw-text-xs tw-text-iron-400">
            Source: <a href={canonicalUrl} target="_blank" rel="noopener noreferrer" className="tw-underline">Wikimedia Commons</a>
          </span>
        </div>
      </div>
    </article>
  );
};

const WikidataCard = ({ preview }: { preview: WikimediaWikidataPreview }) => {
  const { canonicalUrl, label, description, facts, image, credit, license, sitelinks, lang } = preview;
  const primarySitelink = useMemo(() => (sitelinks && sitelinks.length > 0 ? sitelinks[0] : null), [sitelinks]);
  const siteLabel = useMemo(() => {
    if (!primarySitelink) {
      return null;
    }
    if (/wiki$/i.test(primarySitelink.site)) {
      const prefix = primarySitelink.site.replace(/wiki$/i, "");
      return prefix ? `${prefix} Wikipedia` : "Wikipedia";
    }
    return primarySitelink.site;
  }, [primarySitelink]);

  return (
    <article className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4" lang={lang}>
      <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
        {image?.url ? (
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-block md:tw-w-56 md:tw-flex-shrink-0"
          >
            <img
              src={image.url}
              alt={image.alt ?? label}
              width={image.width ?? 400}
              height={image.height ?? 300}
              loading="lazy"
              decoding="async"
              className="tw-h-full tw-w-full tw-rounded-lg tw-object-cover tw-bg-iron-900/60"
            />
          </a>
        ) : null}
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-3">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              <SourceLabel source="wikidata" />
            </span>
            <span className={BADGE_CLASS}>Wikidata</span>
          </div>
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-100 tw-no-underline tw-transition-colors tw-duration-200 hover:tw-text-white"
          >
            {label}
          </a>
          {description ? (
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">{description}</p>
          ) : null}
          {facts.length > 0 ? (
            <dl className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-2 md:tw-grid-cols-2">
              {facts.map((fact) => (
                <div key={`${fact.propertyId}-${fact.label}`} className="tw-space-y-0.5">
                  <dt className="tw-text-xs tw-font-semibold tw-text-iron-400">
                    {fact.label}
                  </dt>
                  <dd className="tw-text-sm tw-text-iron-100">
                    {fact.url ? (
                      <a
                        href={fact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tw-text-iron-100 tw-underline"
                      >
                        {fact.value}
                      </a>
                    ) : (
                      fact.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {(credit || license) && (
            <div className="tw-space-y-1 tw-text-xs tw-text-iron-300">
              {credit ? <p className="tw-m-0">{credit}</p> : null}
              {license ? (
                <p className="tw-m-0">
                  License: {license.url ? (
                    <a
                      href={license.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-underline"
                    >
                      {license.name}
                    </a>
                  ) : (
                    license.name
                  )}
                </p>
              ) : null}
            </div>
          )}
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <ActionLink href={canonicalUrl}>Open on Wikidata</ActionLink>
            {primarySitelink ? (
              <ActionLink href={primarySitelink.url}>{`Read on ${siteLabel ?? primarySitelink.site}`}</ActionLink>
            ) : null}
            <span className="tw-text-xs tw-text-iron-400">
              Source: <a href={canonicalUrl} target="_blank" rel="noopener noreferrer" className="tw-underline">Wikidata</a>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

const UnavailableCard = ({
  href,
  preview,
}: {
  href: string;
  preview: Extract<WikimediaPreview, { kind: "unavailable" }>;
}) => (
  <article className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
    <div className="tw-space-y-3">
      <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
        {preview.message}
      </p>
      <ActionLink href={preview.canonicalUrl}>Open original</ActionLink>
      <span className="tw-text-xs tw-text-iron-400">
        Source: <a href={preview.canonicalUrl} target="_blank" rel="noopener noreferrer" className="tw-underline">
          <SourceLabel source={preview.source} />
        </a>
      </span>
    </div>
  </article>
);

interface WikimediaCardProps {
  readonly href: string;
}

type PreviewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; preview: WikimediaPreview };

const fetchPreview = async (
  href: string,
  signal: AbortSignal
): Promise<WikimediaPreview> => {
  const url = `/api/wikimedia/resolve?url=${encodeURIComponent(href)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load Wikimedia preview: ${response.status}`);
  }

  const payload = (await response.json()) as WikimediaPreview;
  return payload;
};

export default function WikimediaCard({ href }: WikimediaCardProps) {
  const [state, setState] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetchPreview(href, controller.signal)
      .then((preview) => {
        setState({ status: "ready", preview });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, [href]);

  if (state.status === "loading") {
    return <LoadingSkeleton href={href} />;
  }

  if (state.status === "error") {
    return <ErrorFallback href={href} />;
  }

  const preview = state.preview;

  let content: ReactElement;
  if (preview.kind === "article") {
    content = <ArticleCard preview={preview} />;
  } else if (preview.kind === "disambiguation") {
    content = <DisambiguationCard preview={preview} />;
  } else if (preview.kind === "commons-file") {
    content = <CommonsCard preview={preview} />;
  } else if (preview.kind === "wikidata") {
    content = <WikidataCard preview={preview} />;
  } else {
    content = <UnavailableCard href={href} preview={preview} />;
  }

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">{content}</div>
      <ChatItemHrefButtons href={href} />
    </div>
  );
}
