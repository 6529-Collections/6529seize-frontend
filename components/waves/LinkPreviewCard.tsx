"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import { fetchLinkPreview } from "../../services/api/link-preview-api";
import type { WeiboCardResponse } from "@/types/weibo";
import WeiboCard from "./WeiboCard";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
}

type WeiboPreviewState = {
  readonly kind: "weibo";
  readonly data: WeiboCardResponse;
};

type OpenGraphPreviewState = {
  readonly kind: "openGraph";
  readonly data: OpenGraphPreviewData;
};

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly data: WeiboPreviewState | OpenGraphPreviewState }
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
  const [state, setState] = useState<PreviewState>({ type: "loading" });

  const isWeiboResponse = (
    response: Awaited<ReturnType<typeof fetchLinkPreview>>
  ): response is WeiboCardResponse => {
    if (!response || typeof response !== "object") {
      return false;
    }

    const type = (response as { type?: unknown }).type;
    return typeof type === "string" && type.startsWith("weibo.");
  };

  useEffect(() => {
    let active = true;

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        if (isWeiboResponse(response)) {
          setState({
            type: "success",
            data: { kind: "weibo", data: response },
          });
          return;
        }

        const previewData = toPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({
            type: "success",
            data: { kind: "openGraph", data: previewData },
          });
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

  if (state.type === "success") {
    if (state.data.kind === "weibo") {
      return (
        <WeiboCard
          href={href}
          data={state.data.data}
          renderFallback={renderFallback}
        />
      );
    }

    return <OpenGraphPreview href={href} preview={state.data.data} />;
  }

  return <OpenGraphPreview href={href} preview={undefined} />;
}
