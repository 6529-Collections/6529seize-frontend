"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import { fetchLinkPreview } from "@/services/api/link-preview-api";
import EnsPreviewCard from "./ens/EnsPreviewCard";
import { isEnsPreview, type EnsPreview } from "./ens/types";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
}

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "fallback" }
  | { readonly type: "success"; readonly data: OpenGraphPreviewData }
  | { readonly type: "ens"; readonly data: EnsPreview };

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

  useEffect(() => {
    let active = true;

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        if (isEnsPreview(response)) {
          setState({ type: "ens", data: response });
          return;
        }

        const previewData = toPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({ type: "success", data: previewData });
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
        <div className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <div className="tw-flex tw-h-full tw-w-full tw-max-w-full tw-items-center tw-justify-start tw-overflow-hidden tw-break-words tw-[overflow-wrap:anywhere]">
            {fallbackContent}
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (state.type === "success") {
    return <OpenGraphPreview href={href} preview={state.data} />;
  }

  if (state.type === "ens") {
    return (
      <LinkPreviewCardLayout href={href}>
        <div className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <EnsPreviewCard preview={state.data} />
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return <OpenGraphPreview href={href} preview={undefined} />;
}
