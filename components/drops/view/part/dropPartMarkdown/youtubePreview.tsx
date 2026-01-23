import { useEffect, useMemo, useState } from "react";
import type { YoutubeOEmbedResponse } from "@/services/api/youtube";
import { fetchYoutubePreview } from "@/services/api/youtube";

import ChatItemHrefButtons from "@/components/waves/ChatItemHrefButtons";
import { useLinkPreviewContext } from "@/components/waves/LinkPreviewContext";

import { getYoutubeFetchUrl, parseYoutubeLink } from "./youtube";

const YOUTUBE_EMBED_HOSTS = new Map<string, string>([
  ["youtube.com", "www.youtube.com"],
  ["www.youtube.com", "www.youtube.com"],
  ["youtube-nocookie.com", "www.youtube-nocookie.com"],
  ["www.youtube-nocookie.com", "www.youtube-nocookie.com"],
]);

const ALLOWED_IFRAME_ALLOW_FEATURES = new Set([
  "accelerometer",
  "autoplay",
  "clipboard-write",
  "encrypted-media",
  "gyroscope",
  "picture-in-picture",
  "web-share",
]);

const ALLOWED_IFRAME_LOADING_VALUES = new Set(["lazy", "eager"]);
const ALLOWED_IFRAME_REFERRER_POLICIES = new Set([
  "no-referrer",
  "no-referrer-when-downgrade",
  "origin",
  "origin-when-cross-origin",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
]);

const ALLOWED_EMBED_QUERY_PARAMS = new Set([
  "autoplay",
  "controls",
  "enablejsapi",
  "end",
  "feature",
  "index",
  "list",
  "loop",
  "modestbranding",
  "mute",
  "origin",
  "playsinline",
  "rel",
  "start",
]);

const DEFAULT_IFRAME_STYLE = "width:100%;height:100%;";

const escapeHtmlAttribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#39;");

const sanitizeIframeAllow = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const tokens = value
    .split(";")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.split(/\s+/)[0] ?? "");

  const allowedTokens: string[] = [];
  for (const token of tokens) {
    if (ALLOWED_IFRAME_ALLOW_FEATURES.has(token)) {
      if (!allowedTokens.includes(token)) {
        allowedTokens.push(token);
      }
    }
  }

  return allowedTokens.length > 0 ? allowedTokens.join("; ") : null;
};

const sanitizeIframeLoading = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return ALLOWED_IFRAME_LOADING_VALUES.has(normalized) ? normalized : null;
};

const sanitizeIframeReferrerPolicy = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return ALLOWED_IFRAME_REFERRER_POLICIES.has(normalized) ? normalized : null;
};

const sanitizeIframeFrameBorder = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized === "0" || normalized === "1" ? normalized : null;
};

const canonicalizeYoutubeEmbedUrl = (url: URL): URL | null => {
  if (url.protocol !== "https:") {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const canonicalHost = YOUTUBE_EMBED_HOSTS.get(hostname);
  if (!canonicalHost) {
    return null;
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  if (pathSegments.length !== 2 || pathSegments[0] !== "embed") {
    return null;
  }

  const videoId = pathSegments[1] ?? "";
  if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
    return null;
  }

  const canonical = new URL(`https://${canonicalHost}/embed/${videoId}`);
  for (const [key, value] of url.searchParams.entries()) {
    if (ALLOWED_EMBED_QUERY_PARAMS.has(key)) {
      canonical.searchParams.set(key, value);
    }
  }

  return canonical;
};

const sanitizeYoutubeEmbedHtml = (html: string): string | null => {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const iframe = doc.querySelector("iframe");

  if (!iframe) {
    return null;
  }

  const src = iframe.getAttribute("src");
  if (!src) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(src);
  } catch {
    return null;
  }

  const canonicalSrc = canonicalizeYoutubeEmbedUrl(parsedUrl);
  if (!canonicalSrc) {
    return null;
  }

  const attributes: string[] = [];
  attributes.push(`src="${escapeHtmlAttribute(canonicalSrc.toString())}"`);
  attributes.push(`style="${DEFAULT_IFRAME_STYLE}"`);

  const title = iframe.getAttribute("title");
  if (title) {
    attributes.push(`title="${escapeHtmlAttribute(title)}"`);
  }

  const allow = sanitizeIframeAllow(iframe.getAttribute("allow"));
  if (allow) {
    attributes.push(`allow="${escapeHtmlAttribute(allow)}"`);
  }

  if (iframe.hasAttribute("allowfullscreen")) {
    attributes.push("allowfullscreen");
  }

  const loading = sanitizeIframeLoading(iframe.getAttribute("loading"));
  if (loading) {
    attributes.push(`loading="${loading}"`);
  }

  const referrerPolicy = sanitizeIframeReferrerPolicy(
    iframe.getAttribute("referrerpolicy")
  );
  if (referrerPolicy) {
    attributes.push(`referrerpolicy="${referrerPolicy}"`);
  }

  const frameBorder = sanitizeIframeFrameBorder(
    iframe.getAttribute("frameborder")
  );
  if (frameBorder) {
    attributes.push(`frameborder="${frameBorder}"`);
  }

  return `<iframe ${attributes.join(" ")}></iframe>`;
};

interface YoutubePreviewProps {
  readonly href: string;
}

type PreviewState = {
  readonly href: string;
  readonly preview: YoutubeOEmbedResponse | null;
  readonly hasError: boolean;
  readonly showEmbed: boolean;
};

const YoutubePreview = ({ href }: YoutubePreviewProps) => {
  const linkInfo = useMemo(() => parseYoutubeLink(href), [href]);
  if (!linkInfo) {
    throw new Error("Invalid YouTube link");
  }

  const { videoId } = linkInfo;
  const { hideActions } = useLinkPreviewContext();
  const [state, setState] = useState<PreviewState>(() => ({
    href,
    preview: null,
    hasError: false,
    showEmbed: false,
  }));

  const isCurrent = state.href === href;
  const preview = isCurrent ? state.preview : null;
  const hasError = isCurrent ? state.hasError : false;
  const showEmbed = isCurrent ? state.showEmbed : false;

  const handleShowEmbed = () => {
    setState((prev) =>
      prev.href === href
        ? { ...prev, showEmbed: true }
        : { href, preview: null, hasError: false, showEmbed: true }
    );
  };

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    const fetchUrl = getYoutubeFetchUrl(href, videoId);

    fetchYoutubePreview(fetchUrl, abortController.signal)
      .then((data) => {
        if (!isActive) {
          return;
        }

        if (data) {
          const sanitizedHtml = sanitizeYoutubeEmbedHtml(data.html);
          if (!sanitizedHtml) {
            setState((prev) =>
              prev.href === href
                ? { ...prev, preview: null, hasError: true, showEmbed: false }
                : { href, preview: null, hasError: true, showEmbed: false }
            );
            return;
          }

          const normalizedPreview = {
            ...data,
            html: sanitizedHtml,
          };

          setState((prev) =>
            prev.href === href
              ? { ...prev, preview: normalizedPreview, hasError: false }
              : {
                  href,
                  preview: normalizedPreview,
                  hasError: false,
                  showEmbed: false,
                }
          );
          return;
        }

        setState((prev) =>
          prev.href === href
            ? { ...prev, preview: null, hasError: true, showEmbed: false }
            : { href, preview: null, hasError: true, showEmbed: false }
        );
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState((prev) =>
          prev.href === href
            ? { ...prev, preview: null, hasError: true, showEmbed: false }
            : { href, preview: null, hasError: true, showEmbed: false }
        );
      });

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [href, videoId]);

  if (hasError) {
    throw new Error("Failed to load YouTube preview");
  }

  if (!preview) {
    return (
      <div className="tw-flex tw-w-full tw-items-stretch tw-gap-x-1">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-aspect-video tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-800" />
        </div>
        {!hideActions && <ChatItemHrefButtons href={href} />}
      </div>
    );
  }

  const ariaLabel = preview.title
    ? `Play YouTube video ${preview.title}`
    : `Play YouTube video ${videoId}`;

  return (
    <div className="tw-flex tw-w-full tw-items-stretch tw-gap-x-1">
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-black">
          {showEmbed ? (
            <div
              className="tw-relative tw-aspect-video tw-w-full tw-bg-black"
              data-testid="youtube-embed"
              dangerouslySetInnerHTML={{ __html: preview.html }}
            />
          ) : (
            <button
              type="button"
              className="tw-relative tw-aspect-video tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0"
              onClick={handleShowEmbed}
              aria-label={ariaLabel}
            >
              <img
                src={preview.thumbnail_url}
                alt={preview.title ?? `YouTube video ${videoId}`}
                className="tw-h-full tw-w-full tw-object-cover"
              />
              <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="tw-h-12 tw-w-12 tw-text-white tw-opacity-90"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}
        </div>
        <div className="tw-mt-2 tw-space-y-1">
          {preview.title && (
            <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {preview.title}
            </p>
          )}
          {preview.author_name && (
            <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
              {preview.author_name}
            </p>
          )}
        </div>
      </div>
      {!hideActions && <ChatItemHrefButtons href={href} />}
    </div>
  );
};

export default YoutubePreview;
