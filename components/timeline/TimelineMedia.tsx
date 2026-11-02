"use client";

import styles from "./Timeline.module.css";
import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import { getMediaGatewayFallbackUrls } from "@/components/nft-image/utils/gateway-fallback";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTimelineMediaType, MediaType } from "./timeline-media-type";

export { MediaType } from "./timeline-media-type";

interface Props {
  type: MediaType;
  url: string;
  label?: string;
  locale?: SupportedLocale;
}

const IFRAME_FALLBACK_TIMEOUT_MS = 8000;
const MEDIA_TYPE_TIMEOUT_MS = 8000;

function getHistoricalMediaSources(url: string): string[] {
  // Only the recorded Arweave transaction/path proves an alternate gateway
  // serves the same historical asset. Never infer an archive from current NFT data.
  const recorded = parseDecentralizedMediaRef(url);
  if (recorded?.protocol !== "arweave") return [url];
  const resolverUrl = to6529ResolverUrl(
    recorded,
    publicEnv.MEDIA_RESOLVER_ENDPOINT
  );
  // The configured resolver may have another host or a path prefix. Its actual
  // request path must still contain the complete, unmodified historical reference.
  const resolverPath = to6529ResolverUrl(recorded, "");
  const matchingResolver = new URL(resolverUrl).pathname.endsWith(resolverPath)
    ? resolverUrl
    : null;
  const matchingSources = getMediaGatewayFallbackUrls(url).filter(
    (candidate) => {
      if (candidate === matchingResolver) return true;
      const ref = parseDecentralizedMediaRef(candidate);
      return (
        ref?.protocol === "arweave" &&
        ref.id === recorded.id &&
        ref.path === recorded.path
      );
    }
  );
  return Array.from(new Set([url, ...matchingSources]));
}

export default function TimelineMediaComponent(props: Readonly<Props>) {
  if (props.type === MediaType.UNKNOWN) {
    return <DetectedTimelineMedia key={props.url} {...props} />;
  }
  return <TimelineMediaPreview key={`${props.type}:${props.url}`} {...props} />;
}

function getHistoricalMediaHref(url: string): string | null {
  for (const source of getHistoricalMediaSources(url)) {
    try {
      const parsed = new URL(source);
      if (
        (parsed.protocol === "https:" || parsed.protocol === "http:") &&
        !parsed.username &&
        !parsed.password
      ) {
        return parsed.href;
      }
    } catch {
      // Malformed metadata is text, never a navigable URL.
    }
  }
  return null;
}

async function detectHistoricalMediaType(
  url: string,
  signal: AbortSignal
): Promise<MediaType> {
  // Only recognized Arweave references may trigger automatic header requests.
  // Arbitrary historical hosts with no format retain the explicit open link.
  if (parseDecentralizedMediaRef(url)?.protocol !== "arweave") {
    return MediaType.UNKNOWN;
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  // One shared deadline bounds the complete, finite gateway lookup. HEAD
  // reads only headers; never download a historical animation to classify it.
  const timeout = globalThis.setTimeout(abort, MEDIA_TYPE_TIMEOUT_MS);
  try {
    for (const source of getHistoricalMediaSources(url)) {
      if (controller.signal.aborted) break;
      try {
        const candidate = new URL(source);
        if (
          candidate.protocol !== "https:" ||
          candidate.username ||
          candidate.password
        )
          continue;
        const response = await fetch(source, {
          method: "HEAD",
          credentials: "omit",
          signal: controller.signal,
        });
        controller.signal.throwIfAborted();
        if (!response.ok) continue;
        const detected = getTimelineMediaType(
          response.headers.get("content-type")
        );
        if (detected !== MediaType.UNKNOWN) return detected;
      } catch {
        // A failed or CORS-blocked source can use only a matching gateway.
      }
    }
    return MediaType.UNKNOWN;
  } finally {
    globalThis.clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

function DetectedTimelineMedia(props: Readonly<Props>) {
  const { data: type = MediaType.UNKNOWN } = useQuery({
    queryKey: [QueryKey.NFT_TIMELINE_MEDIA_TYPE, props.url],
    queryFn: ({ signal }) => detectHistoricalMediaType(props.url, signal),
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const locale = props.locale ?? DEFAULT_LOCALE;
  const label = props.label ?? t(locale, "timeline.media.defaultLabel");
  if (type === MediaType.UNKNOWN) {
    const href = getHistoricalMediaHref(props.url);
    if (!href) {
      return <span>{t(locale, "timeline.media.unavailable", { label })}</span>;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {t(locale, "timeline.media.openMedia", { label })}
      </a>
    );
  }
  return <TimelineMediaPreview {...props} type={type} />;
}

function TimelineMediaPreview(props: Readonly<Props>) {
  const locale = props.locale ?? DEFAULT_LOCALE;
  const label = props.label ?? t(locale, "timeline.media.defaultLabel");
  const sources = useMemo(
    () => getHistoricalMediaSources(props.url),
    [props.url]
  );
  const [{ index, didLoad }, setLoadState] = useState({
    index: 0,
    didLoad: false,
  });
  const activeSrc = sources[index];
  const advance = useCallback(() => {
    setLoadState((current) =>
      current.index === index && index + 1 < sources.length
        ? { index: index + 1, didLoad: false }
        : current
    );
  }, [index, sources.length]);

  useEffect(() => {
    if (
      props.type !== MediaType.HTML ||
      didLoad ||
      index + 1 >= sources.length
    ) {
      return;
    }
    // Cross-origin frames do not reliably report network errors. Match the
    // existing NFT HTML renderer's bounded load timeout for Arweave gateways.
    const timeout = globalThis.setTimeout(advance, IFRAME_FALLBACK_TIMEOUT_MS);
    return () => globalThis.clearTimeout(timeout);
  }, [advance, didLoad, index, props.type, sources.length]);

  if (props.type === MediaType.VIDEO) {
    return (
      <SeizeVideoPlayer
        template="ambient-media"
        className={styles["timelineMediaImage"]}
        src={props.url}
        fallbackSources={sources}
        autoPlay={false}
        muted
        loop
        align="center"
        aria-label={t(locale, "timeline.media.videoAriaLabel", { label })}
      />
    );
  }
  if (props.type === MediaType.HTML) {
    // React does not attach a direct iframe error listener; capture non-bubbling errors.
    return (
      <iframe
        key={activeSrc}
        className={styles["timelineMediaImage"]}
        src={activeSrc}
        sandbox="allow-scripts"
        title={t(locale, "timeline.media.htmlTitle", { label })}
        onErrorCapture={advance}
        onLoad={() => {
          setLoadState((current) =>
            current.index === index ? { ...current, didLoad: true } : current
          );
        }}
      ></iframe>
    );
  }
  return (
    // Native img is intentional: timeline media hosts come from arbitrary NFT metadata.
    <img
      key={activeSrc}
      src={activeSrc}
      className={styles["timelineMediaImage"]}
      alt={t(locale, "timeline.media.imageAlt", { label })}
      onError={advance}
    />
  );
}
