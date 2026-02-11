"use client";

import { useEffect, useState } from "react";

import OpenGraphPreview, {
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import ManifoldItemPreviewCard from "./ManifoldItemPreviewCard";
import {
  fetchLinkPreview,
  type ManifoldListingLinkPreview,
} from "@/services/api/link-preview-api";

interface ManifoldPreviewProps {
  readonly href: string;
}

type PreviewState =
  | { readonly type: "loading"; readonly href: string }
  | {
      readonly type: "manifold";
      readonly href: string;
      readonly data: ManifoldListingLinkPreview;
    }
  | {
      readonly type: "generic";
      readonly href: string;
      readonly data: OpenGraphPreviewData;
    }
  | { readonly type: "error"; readonly href: string; readonly error: Error };

type PickedMedia = {
  readonly url: string;
  readonly mimeType: string;
};

const isManifoldListingPreview = (
  value: Awaited<ReturnType<typeof fetchLinkPreview>>
): value is ManifoldListingLinkPreview => {
  return (
    value.type === "manifold.listing" &&
    typeof value.manifold === "object" &&
    value.manifold !== null
  );
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

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

const normalizeMimeType = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const inferMimeTypeFromUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    const extensionMatch = parsed.pathname
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/);
    if (!extensionMatch?.[1]) {
      return undefined;
    }

    return IMAGE_MIME_BY_EXTENSION[extensionMatch[1]];
  } catch {
    const path = url.split("?")[0]?.toLowerCase() ?? "";
    const extensionMatch = path.match(/\.([a-z0-9]+)$/);
    if (!extensionMatch?.[1]) {
      return undefined;
    }

    return IMAGE_MIME_BY_EXTENSION[extensionMatch[1]];
  }
};

const toPickedMedia = (
  candidate:
    | {
        url?: string | null | undefined;
        secureUrl?: string | null | undefined;
        type?: string | null | undefined;
      }
    | null
    | undefined
): PickedMedia | undefined => {
  if (!candidate) {
    return undefined;
  }

  const urlCandidate = candidate.url ?? candidate.secureUrl;
  if (typeof urlCandidate !== "string" || urlCandidate.trim().length === 0) {
    return undefined;
  }

  const url = urlCandidate.trim();
  const mimeType =
    normalizeMimeType(candidate.type) ?? inferMimeTypeFromUrl(url) ?? "image/*";

  return {
    url,
    mimeType,
  };
};

const pickMedia = (
  data: ManifoldListingLinkPreview
): PickedMedia | undefined => {
  const primary = toPickedMedia(data.image);
  if (primary) {
    return primary;
  }

  const images = data.images;
  if (images === null || images === undefined) {
    return undefined;
  }

  for (const image of images) {
    const candidate = toPickedMedia(image);
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
};

export default function ManifoldPreview({ href }: ManifoldPreviewProps) {
  const [state, setState] = useState<PreviewState>({ type: "loading", href });

  useEffect(() => {
    let active = true;

    const loadPreview = async (): Promise<void> => {
      try {
        const response = await fetchLinkPreview(href);
        if (!active) {
          return;
        }

        if (isManifoldListingPreview(response)) {
          setState({ type: "manifold", href, data: response });
          return;
        }

        setState({ type: "generic", href, data: toPreviewData(response) });
      } catch (error: unknown) {
        if (active) {
          setState({
            type: "error",
            href,
            error:
              error instanceof Error
                ? error
                : new Error("Failed to load Manifold preview"),
          });
        }
      }
    };

    void loadPreview();

    return () => {
      active = false;
    };
  }, [href]);

  if (state.href !== href || state.type === "loading") {
    return <OpenGraphPreview href={href} preview={undefined} />;
  }

  if (state.type === "error") {
    throw state.error;
  }

  if (state.type === "manifold") {
    const title = state.data.title?.trim();
    const media = pickMedia(state.data);

    if (title && media) {
      return (
        <ManifoldItemPreviewCard
          href={href}
          title={title}
          mediaUrl={media.url}
          mediaMimeType={media.mimeType}
        />
      );
    }

    return <OpenGraphPreview href={href} preview={toPreviewData(state.data)} />;
  }

  return <OpenGraphPreview href={href} preview={state.data} />;
}
