"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import TruthSocialCard, {
  type TruthSocialCardData,
} from "./truth/TruthSocialCard";
import { fetchLinkPreview } from "../../services/api/link-preview-api";
import type {
  TruthSocialPostData,
  TruthSocialProfileData,
} from "../../services/api/link-preview-api";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
}

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "og"; readonly data: OpenGraphPreviewData }
  | { readonly type: "truth"; readonly data: TruthSocialCardData }
  | { readonly type: "fallback" };

const toPreviewData = (
  response: Awaited<ReturnType<typeof fetchLinkPreview>>
): OpenGraphPreviewData => {
  if (!response) {
    return {};
  }

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

function isTruthSocialPostData(value: unknown): value is TruthSocialPostData {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as TruthSocialPostData).handle === "string" &&
    typeof (value as TruthSocialPostData).postId === "string"
  );
}

function isTruthSocialProfileData(value: unknown): value is TruthSocialProfileData {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as TruthSocialProfileData).handle === "string"
  );
}

function readCanonicalUrl(
  response: Awaited<ReturnType<typeof fetchLinkPreview>>,
  fallback: string
): string {
  const candidates = [response?.canonicalUrl, response?.url, response?.requestUrl];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return fallback;
}

function toTruthSocialData(
  response: Awaited<ReturnType<typeof fetchLinkPreview>>,
  href: string
): TruthSocialCardData | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  if (response.type === "truth.post" && isTruthSocialPostData(response.post)) {
    return {
      kind: "post",
      canonicalUrl: readCanonicalUrl(response, href),
      post: {
        ...response.post,
        images: Array.isArray(response.post.images) ? response.post.images : [],
      },
    };
  }

  if (response.type === "truth.profile" && isTruthSocialProfileData(response.profile)) {
    return {
      kind: "profile",
      canonicalUrl: readCanonicalUrl(response, href),
      profile: response.profile,
    };
  }

  return null;
}

export default function LinkPreviewCard({
  href,
  renderFallback,
}: LinkPreviewCardProps) {
  const [state, setState] = useState<PreviewState>({
    type: "loading",
  });

  useEffect(() => {
    let active = true;

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        const truthData = toTruthSocialData(response, href);
        if (truthData) {
          setState({ type: "truth", data: truthData });
          return;
        }

        const previewData = toPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({ type: "og", data: previewData });
          return;
        }

        setState({ type: "fallback" });
      })
      .catch(() => {
        if (active) {
          setState({ type: "fallback" });
        }
      });

    return () => {
      active = false;
    };
  }, [href]);

  if (state.type === "fallback") {
    const fallbackContent = renderFallback();

    return (
      <LinkPreviewCardLayout href={href}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-start">
            {fallbackContent}
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (state.type === "truth") {
    return <TruthSocialCard href={href} data={state.data} />;
  }

  const preview = state.type === "og" ? state.data : undefined;

  return <OpenGraphPreview href={href} preview={preview} />;
}
