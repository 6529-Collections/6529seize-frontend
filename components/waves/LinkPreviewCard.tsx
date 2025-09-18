"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import FacebookPreview from "./FacebookPreview";
import {
  fetchLinkPreview,
  type FacebookLinkPreviewResponse,
  type LinkPreviewResponse,
} from "../../services/api/link-preview-api";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
}

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "opengraph"; readonly data: OpenGraphPreviewData }
  | { readonly type: "facebook"; readonly data: FacebookLinkPreviewResponse }
  | { readonly type: "fallback" };

const FACEBOOK_CARD_FLAG_CANDIDATES = [
  "VITE_FEATURE_FACEBOOK_CARD",
  "NEXT_PUBLIC_VITE_FEATURE_FACEBOOK_CARD",
  "NEXT_PUBLIC_FEATURE_FACEBOOK_CARD",
  "FEATURE_FACEBOOK_CARD",
] as const;

const parseFeatureFlagValue = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  if (["1", "true", "on", "yes", "enabled"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "off", "no", "disabled"].includes(normalized)) {
    return false;
  }

  return Boolean(normalized);
};

const isFacebookCardEnabled = (): boolean => {
  for (const flagName of FACEBOOK_CARD_FLAG_CANDIDATES) {
    const value = process.env[flagName];
    if (typeof value === "string") {
      return parseFeatureFlagValue(value);
    }
  }

  return true;
};

const isFacebookPreview = (
  response: LinkPreviewResponse
): response is FacebookLinkPreviewResponse => {
  return typeof (response as { type?: unknown }).type === "string"
    ? ((response as { type: string }).type.startsWith("facebook."))
    : false;
};

const toOpenGraphPreviewData = (response: LinkPreviewResponse): OpenGraphPreviewData => {
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

export default function LinkPreviewCard({
  href,
  renderFallback,
}: LinkPreviewCardProps) {
  const [state, setState] = useState<PreviewState>({ type: "loading" });

  useEffect(() => {
    let active = true;
    const facebookCardEnabled = isFacebookCardEnabled();

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        if (facebookCardEnabled && isFacebookPreview(response)) {
          setState({ type: "facebook", data: response });
          return;
        }

        const previewData = toOpenGraphPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({ type: "opengraph", data: previewData });
        } else {
          setState({ type: "fallback" });
        }
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

  if (state.type === "facebook") {
    return <FacebookPreview href={href} preview={state.data} />;
  }

  if (state.type === "opengraph") {
    return <OpenGraphPreview href={href} preview={state.data} />;
  }

  return <OpenGraphPreview href={href} preview={undefined} />;
}
