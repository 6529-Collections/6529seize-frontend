"use client";

import { ensureTwitterLink } from "@/components/drops/view/part/dropPartMarkdown/twitter";
import SmartLinkPreview from "@/components/waves/SmartLinkPreview";
import TwitterPreviewCard from "@/components/waves/TwitterPreviewCard";
import type { LinkPreviewVariant } from "@/components/waves/LinkPreviewContext";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

const KNOWN_INTERNAL_LINK_TITLE_KEYS: Record<string, MessageKey> = {
  "/network/wavescore": "home.boostedDrop.internalLinks.networkWaveScoreTitle",
};

const getUrlDisplayTitle = ({
  source,
  url,
}: {
  readonly source: string;
  readonly url: URL;
}): string => {
  const path = url.pathname === "/" ? "" : url.pathname;
  return `${source}${path}${url.search}${url.hash}`;
};

const getFallbackPreview = ({
  href,
}: {
  readonly href: string;
}): {
  readonly isInternal6529: boolean;
  readonly source: string;
  readonly title: string;
} => {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./i, "");
    const source = host || href;
    const isInternal6529 = source === "6529.io" || source.endsWith(".6529.io");
    const knownTitleKey = isInternal6529
      ? KNOWN_INTERNAL_LINK_TITLE_KEYS[url.pathname.toLowerCase()]
      : undefined;

    if (knownTitleKey) {
      return {
        isInternal6529,
        source,
        title: t(DEFAULT_LOCALE, knownTitleKey),
      };
    }

    return {
      isInternal6529,
      source,
      title: getUrlDisplayTitle({ source, url }),
    };
  } catch {
    return { isInternal6529: false, source: href, title: href };
  }
};

const getTwitterPayload = (href: string) => {
  try {
    return ensureTwitterLink(href);
  } catch {
    return null;
  }
};

const getFallbackSourceLabel = ({
  isInternal6529,
  source,
}: {
  readonly isInternal6529: boolean;
  readonly source: string;
}): string =>
  isInternal6529
    ? t(DEFAULT_LOCALE, "home.boostedDrop.internalLinkSource", { source })
    : source;

export default function BoostedDropLinkPreview({
  href,
  variant = "home",
}: {
  readonly href: string;
  readonly variant?: LinkPreviewVariant | undefined;
}) {
  const twitterPayload = getTwitterPayload(href);
  if (twitterPayload) {
    const { tweetId, href: normalizedHref } = twitterPayload;
    return (
      <div className="tw-h-full tw-w-full tw-min-w-0 tw-max-w-full">
        <TwitterPreviewCard href={normalizedHref} tweetId={tweetId} />
      </div>
    );
  }

  return (
    <div className="tw-h-full tw-w-full tw-min-w-0 tw-max-w-full">
      <SmartLinkPreview
        hideActions
        href={href}
        variant={variant}
        renderFallback={() => {
          const fallback = getFallbackPreview({ href });
          const sourceLabel = getFallbackSourceLabel(fallback);

          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              className="tw-[overflow-wrap:anywhere] tw-flex tw-h-full tw-min-h-[4.5rem] tw-w-full tw-flex-col tw-justify-center tw-gap-1.5 tw-rounded-lg tw-bg-iron-900/35 tw-px-3 tw-py-2.5 tw-text-left tw-no-underline tw-shadow-[inset_2px_0_0_rgba(245,158,11,0.34)] tw-transition tw-duration-200 hover:tw-bg-iron-900/60 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            >
              <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
                {fallback.isInternal6529 && (
                  <span className="tw-flex tw-size-5 tw-flex-shrink-0 tw--translate-y-px tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-amber-400/15 tw-bg-amber-400/10 tw-text-[8px] tw-font-bold tw-leading-none tw-text-amber-200">
                    6529
                  </span>
                )}
                <span className="tw-line-clamp-1 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-500">
                  {sourceLabel}
                </span>
              </span>
              <span className="tw-line-clamp-2 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
                {fallback.title}
              </span>
            </a>
          );
        }}
      />
    </div>
  );
}
