"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import JackButcherPreview from "./JackButcherPreview";
import { fetchLinkPreview } from "../../services/api/link-preview-api";
import { isJackButcherCard, type JackButcherCard } from "../../types/jackButcher";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
}

type PreviewState =
  | { readonly type: "loading"; readonly data: OpenGraphPreviewData | null }
  | { readonly type: "success"; readonly data: OpenGraphPreviewData }
  | { readonly type: "jack"; readonly data: JackButcherCard }
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

export default function LinkPreviewCard({
  href,
  renderFallback,
}: LinkPreviewCardProps) {
  const [state, setState] = useState<PreviewState>({
    type: "loading",
    data: null,
  });

  useEffect(() => {
    let active = true;

    setState({ type: "loading", data: null });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        if (isJackButcherCard(response)) {
          setState({ type: "jack", data: response });
          return;
        }

        const previewData = toPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({ type: "success", data: previewData });
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

  if (state.type === "jack") {
    return <JackButcherPreview href={href} data={state.data} />;
  }

  const preview = state.type === "success" ? state.data : undefined;

  return <OpenGraphPreview href={href} preview={preview} />;
}
