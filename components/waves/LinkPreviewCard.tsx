"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import { fetchLinkPreview } from "@/services/api/link-preview-api";
import EnsPreviewCard from "./ens/EnsPreviewCard";
import { isEnsPreview, type EnsPreview } from "./ens/types";
import {
  useLinkPreviewVariant,
  type LinkPreviewVariant,
} from "./LinkPreviewContext";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly hideActions?: boolean | undefined;
  readonly renderFallback: () => ReactElement;
  readonly variant?: LinkPreviewVariant | undefined;
}

type PreviewState =
  | { readonly type: "loading"; readonly href: string }
  | { readonly type: "fallback"; readonly href: string }
  | {
      readonly type: "success";
      readonly href: string;
      readonly data: OpenGraphPreviewData;
    }
  | { readonly type: "ens"; readonly href: string; readonly data: EnsPreview };

const CHAT_STABLE_FRAME_CLASSES =
  "tw-h-[10rem] tw-min-h-[10rem] tw-max-h-[10rem] tw-w-full tw-overflow-hidden md:tw-h-[11rem] md:tw-min-h-[11rem] md:tw-max-h-[11rem]";
const CHAT_FIRST_PARTY_FRAME_CLASSES =
  "tw-h-[15rem] tw-min-h-[15rem] tw-max-h-[15rem] tw-w-full tw-overflow-hidden lg:tw-h-[11rem] lg:tw-min-h-[11rem] lg:tw-max-h-[11rem]";
const CHAT_COLLECTION_FRAME_CLASSES =
  "tw-h-[18rem] tw-min-h-[18rem] tw-max-h-[18rem] tw-w-full tw-overflow-hidden sm:tw-h-[15rem] sm:tw-min-h-[15rem] sm:tw-max-h-[15rem] md:tw-h-[15rem] md:tw-min-h-[15rem] md:tw-max-h-[15rem]";
const CHAT_THE_MEMES_FRAME_CLASSES =
  "tw-h-[18rem] tw-min-h-[18rem] tw-max-h-[18rem] tw-w-full tw-overflow-hidden sm:tw-h-[15rem] sm:tw-min-h-[15rem] sm:tw-max-h-[15rem] md:tw-h-[12rem] md:tw-min-h-[12rem] md:tw-max-h-[12rem]";
const CHAT_VIDEO_FRAME_CLASSES =
  "tw-h-[18rem] tw-min-h-[18rem] tw-max-h-[18rem] tw-w-full tw-overflow-hidden sm:tw-h-[14rem] sm:tw-min-h-[14rem] sm:tw-max-h-[14rem] md:tw-h-[15rem] md:tw-min-h-[15rem] md:tw-max-h-[15rem]";
const CHAT_FARCASTER_FRAME_CLASSES =
  "tw-h-[24rem] tw-min-h-[24rem] tw-max-h-[24rem] tw-w-full tw-overflow-hidden sm:tw-h-[13rem] sm:tw-min-h-[13rem] sm:tw-max-h-[13rem] md:tw-h-[14rem] md:tw-min-h-[14rem] md:tw-max-h-[14rem]";

type ChatStableFrameKind =
  | "generic"
  | "first-party"
  | "the-memes"
  | "collection"
  | "video"
  | "farcaster";

const normalizePreviewHostname = (hostname: string): string =>
  hostname.toLowerCase().replace(/^www\./, "");

const is6529Hostname = (hostname: string): boolean => {
  const normalizedHostname = normalizePreviewHostname(hostname);
  return (
    normalizedHostname === "6529.io" || normalizedHostname.endsWith(".6529.io")
  );
};

const isKnownBarePreviewHostname = (hostname: string): boolean => {
  const normalizedHostname = normalizePreviewHostname(hostname);
  return (
    is6529Hostname(normalizedHostname) ||
    normalizedHostname === "youtu.be" ||
    normalizedHostname === "youtube.com" ||
    normalizedHostname.endsWith(".youtube.com") ||
    normalizedHostname === "youtube-nocookie.com" ||
    normalizedHostname.endsWith(".youtube-nocookie.com") ||
    normalizedHostname === "warpcast.com" ||
    normalizedHostname.endsWith(".warpcast.com") ||
    normalizedHostname === "farcaster.xyz" ||
    normalizedHostname.endsWith(".farcaster.xyz")
  );
};

const containsAsciiWhitespace = (value: string): boolean => {
  for (const character of value) {
    if (
      character === " " ||
      character === "\t" ||
      character === "\n" ||
      character === "\r" ||
      character === "\f"
    ) {
      return true;
    }
  }

  return false;
};

const parseBarePreviewHref = (trimmedHref: string): URL | null => {
  if (containsAsciiWhitespace(trimmedHref)) {
    return null;
  }

  const slashIndex = trimmedHref.indexOf("/");
  if (slashIndex <= 0 || slashIndex >= trimmedHref.length - 1) {
    return null;
  }

  const hostnameCandidate = trimmedHref.slice(0, slashIndex);
  if (!hostnameCandidate.includes(".") || hostnameCandidate.includes(":")) {
    return null;
  }

  const bareUrl = new URL(`https://${trimmedHref}`);
  return isKnownBarePreviewHostname(bareUrl.hostname) ? bareUrl : null;
};

const parsePreviewHref = (href: string): URL | null => {
  const trimmedHref = href.trim();
  if (!trimmedHref) {
    return null;
  }

  try {
    if (trimmedHref.startsWith("//")) {
      return new URL(`https:${trimmedHref}`);
    }

    if (
      /^[a-z][a-z0-9+.-]*:/i.test(trimmedHref) ||
      trimmedHref.startsWith("/")
    ) {
      return new URL(trimmedHref, "https://6529.io");
    }

    return parseBarePreviewHref(trimmedHref);
  } catch {
    return null;
  }
};

const isNumericPathSegment = (value: string | undefined): boolean =>
  !!value && /^\d+$/.test(value);

const isContractPathSegment = (value: string | undefined): boolean =>
  !!value && /^0x[a-f0-9]{40}$/i.test(value);

const is6529CollectionPathname = (pathname: string): boolean => {
  const [root, first, second] = pathname.split("/").filter(Boolean);

  if (root === "the-memes" || root === "meme-lab" || root === "6529-gradient") {
    return isNumericPathSegment(first);
  }

  if (root === "nextgen" && first === "token") {
    return isNumericPathSegment(second);
  }

  if (root === "rememes") {
    return isContractPathSegment(first) && isNumericPathSegment(second);
  }

  return false;
};

const isTheMemesPathname = (pathname: string): boolean => {
  const [root, id] = pathname.split("/").filter(Boolean);
  return root === "the-memes" && isNumericPathSegment(id);
};

const getChatStableFrameKind = (href: string): ChatStableFrameKind => {
  const parsed = parsePreviewHref(href);
  if (!parsed) {
    return "generic";
  }

  const hostname = normalizePreviewHostname(parsed.hostname);
  const pathname = parsed.pathname.toLowerCase();

  if (
    hostname === "youtu.be" ||
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtube-nocookie.com" ||
    hostname.endsWith(".youtube-nocookie.com")
  ) {
    return "video";
  }

  if (
    hostname === "warpcast.com" ||
    hostname.endsWith(".warpcast.com") ||
    hostname === "farcaster.xyz" ||
    hostname.endsWith(".farcaster.xyz")
  ) {
    return "farcaster";
  }

  if (is6529Hostname(hostname)) {
    if (isTheMemesPathname(pathname)) {
      return "the-memes";
    }

    if (is6529CollectionPathname(pathname)) {
      return "collection";
    }

    return "first-party";
  }

  return "generic";
};

const getChatStableFrameClasses = (kind: ChatStableFrameKind): string => {
  switch (kind) {
    case "first-party":
      return CHAT_FIRST_PARTY_FRAME_CLASSES;
    case "the-memes":
      return CHAT_THE_MEMES_FRAME_CLASSES;
    case "collection":
      return CHAT_COLLECTION_FRAME_CLASSES;
    case "video":
      return CHAT_VIDEO_FRAME_CLASSES;
    case "farcaster":
      return CHAT_FARCASTER_FRAME_CLASSES;
    case "generic":
      return CHAT_STABLE_FRAME_CLASSES;
  }
};

const toPreviewData = (
  response: Awaited<ReturnType<typeof fetchLinkPreview>>
): OpenGraphPreviewData => {
  return {
    ...response,
    image: response.image ?? undefined,
    images: response.images ?? undefined,
    url: response.url ?? response.requestUrl ?? undefined,
    siteName: response.siteName ?? undefined,
    description: response.description ?? undefined,
    title: response.title ?? undefined,
  };
};

export default function LinkPreviewCard({
  hideActions = false,
  href,
  renderFallback,
  variant,
}: LinkPreviewCardProps) {
  const contextVariant = useLinkPreviewVariant();
  const resolvedVariant = variant ?? contextVariant;
  const shouldUseStableFrame = resolvedVariant === "chat";
  const [state, setState] = useState<PreviewState>(() => ({
    type: "loading",
    href,
  }));

  useEffect(() => {
    let active = true;

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        if (isEnsPreview(response)) {
          setState({ type: "ens", data: response, href });
          return;
        }

        const previewData = toPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({ type: "success", data: previewData, href });
          return;
        }

        setState({ type: "fallback", href });
      })
      .catch(() => {
        if (active) {
          setState({ type: "fallback", href });
        }
      });

    return () => {
      active = false;
    };
  }, [href]);

  const isCurrent = state.href === href;
  let content: ReactElement;

  if (isCurrent && state.type === "fallback") {
    const fallbackContent = renderFallback();
    content = (
      <LinkPreviewCardLayout
        href={href}
        hideActions={hideActions}
        variant={resolvedVariant}
      >
        <div
          className={
            resolvedVariant === "home"
              ? "tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-4"
              : "tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-transparent"
          }
        >
          <div className="tw-[overflow-wrap:anywhere] tw-flex tw-h-full tw-min-h-0 tw-w-full tw-max-w-full tw-items-center tw-justify-start tw-overflow-y-auto tw-break-words">
            {fallbackContent}
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  } else if (isCurrent && state.type === "success") {
    content = (
      <OpenGraphPreview
        hideActions={hideActions}
        href={href}
        preview={state.data}
        variant={resolvedVariant}
      />
    );
  } else if (isCurrent && state.type === "ens") {
    content = (
      <LinkPreviewCardLayout
        href={href}
        hideActions={hideActions}
        variant={resolvedVariant}
      >
        <div
          className={
            resolvedVariant === "home"
              ? "tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-4"
              : "tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
          }
        >
          <div className="tw-h-full tw-min-h-0 tw-overflow-y-auto">
            <EnsPreviewCard preview={state.data} />
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  } else {
    content = (
      <OpenGraphPreview
        hideActions={hideActions}
        href={href}
        preview={undefined}
        variant={resolvedVariant}
      />
    );
  }

  if (!shouldUseStableFrame) {
    return content;
  }

  // Chat frames must not resize after async preview resolution; resolved cards
  // clamp or scroll inside the href-classified reserve to avoid feed CLS.
  // Unknown-host miniapps intentionally keep the generic reserve after fetch;
  // the Farcaster miniapp preview scrolls internally instead of growing the feed.
  const stableFrameClasses = getChatStableFrameClasses(
    getChatStableFrameKind(href)
  );

  return (
    <div
      className={stableFrameClasses}
      data-testid="link-preview-card-stable-frame"
    >
      {content}
    </div>
  );
}
