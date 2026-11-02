"use client";

import styles from "./Timeline.module.css";
import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import { getMediaGatewayFallbackUrls } from "@/components/nft-image/utils/gateway-fallback";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { parseDecentralizedMediaRef } from "@/lib/media/decentralized-media";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  type: MediaType;
  url: string;
  label?: string;
  locale?: SupportedLocale;
}

export enum MediaType {
  IMAGE,
  VIDEO,
  HTML,
}

const IFRAME_FALLBACK_TIMEOUT_MS = 8000;

function getHistoricalMediaSources(url: string): string[] {
  // Only the recorded Arweave transaction/path proves an alternate gateway
  // serves the same historical asset. Never infer an archive from current NFT data.
  const recorded = parseDecentralizedMediaRef(url);
  if (recorded?.protocol !== "arweave") return [url];
  const matchingSources = getMediaGatewayFallbackUrls(url).filter(
    (candidate) => {
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
  return <TimelineMediaPreview key={`${props.type}:${props.url}`} {...props} />;
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
        autoPlay
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
