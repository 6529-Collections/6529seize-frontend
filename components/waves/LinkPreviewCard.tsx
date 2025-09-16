"use client";

import { useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import { fetchLinkPreview } from "../../services/api/link-preview-api";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => JSX.Element;
}

type PreviewState =
  | { readonly type: "loading"; readonly data: OpenGraphPreviewData | null }
  | { readonly type: "success"; readonly data: OpenGraphPreviewData }
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
    return renderFallback();
  }

  const preview = state.type === "success" ? state.data : undefined;

  return <OpenGraphPreview href={href} preview={preview} />;
}
