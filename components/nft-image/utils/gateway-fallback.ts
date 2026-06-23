import type React from "react";
import { publicEnv } from "@/config/env";
import {
  getDecentralizedMediaFetchUrls,
  parseDecentralizedMediaRef,
} from "@/lib/media/decentralized-media";

function dedupe(list: readonly string[]): string[] {
  return Array.from(new Set(list));
}

type MediaErrorEvent = React.SyntheticEvent<
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLIFrameElement
  | (HTMLElement & { src: string }),
  Event
>;

const DS_ORIGINAL = "decentralizedMediaOriginalSrc";
const DS_TRIED = "decentralizedMediaTriedSrcs";

function classifyGatewayAssetUrl(url: string):
  | { kind: "empty" }
  | {
      kind: "decentralized";
      sourceUrl: string;
      protocol: "ipfs" | "ipns" | "arweave";
    }
  | { kind: "other"; sourceUrl: string } {
  const trimmed = url.trim();
  if (!trimmed) {
    return { kind: "empty" };
  }

  const parsed = parseDecentralizedMediaRef(trimmed);
  if (parsed) {
    return {
      kind: "decentralized",
      protocol: parsed.protocol,
      sourceUrl: trimmed,
    };
  }

  return { kind: "other", sourceUrl: trimmed };
}

export function getMediaGatewayFallbackUrls(url: string): string[] {
  const assetUrl = classifyGatewayAssetUrl(url);
  if (assetUrl.kind === "empty") {
    return [];
  }

  if (assetUrl.kind === "other") {
    return [assetUrl.sourceUrl];
  }

  return getDecentralizedMediaFetchUrls(assetUrl.sourceUrl, {
    includeExternalFallbacks: true,
    resolverEndpoint: publicEnv.MEDIA_RESOLVER_ENDPOINT,
  });
}

export function shouldUseIframeFallbackTimeout(url: string): boolean {
  const assetUrl = classifyGatewayAssetUrl(url);
  return assetUrl.kind === "decentralized" && assetUrl.protocol === "arweave";
}

function readTriedUrls(target: HTMLElement): string[] {
  return target.dataset?.[DS_TRIED]?.split("|").filter(Boolean) ?? [];
}

function writeTriedUrls(target: HTMLElement, urls: readonly string[]): void {
  if (target.dataset) {
    target.dataset[DS_TRIED] = dedupe(urls).join("|");
  }
}

export function withArweaveFallback(
  onError?: (event: MediaErrorEvent) => void
): (event: MediaErrorEvent) => void {
  return (event: MediaErrorEvent) => {
    const target = event.currentTarget;
    const currentSrc = target.src;

    if (!currentSrc) {
      onError?.(event);
      return;
    }

    const storedOriginal = target.dataset?.[DS_ORIGINAL];
    const originalSrc = storedOriginal ?? currentSrc;
    const original = classifyGatewayAssetUrl(originalSrc);

    if (original.kind !== "decentralized" || original.protocol !== "arweave") {
      onError?.(event);
      return;
    }

    if (!storedOriginal && target.dataset) {
      target.dataset[DS_ORIGINAL] = originalSrc;
    }

    const triedUrls = dedupe([...readTriedUrls(target), currentSrc]);
    const nextUrl =
      getMediaGatewayFallbackUrls(original.sourceUrl).find(
        (candidate) => !triedUrls.includes(candidate)
      ) ?? null;

    if (!nextUrl) {
      writeTriedUrls(target, triedUrls);
      onError?.(event);
      return;
    }

    writeTriedUrls(target, [...triedUrls, nextUrl]);
    target.src = nextUrl;
  };
}
