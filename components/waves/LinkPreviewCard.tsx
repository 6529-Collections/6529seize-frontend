"use client";

import { useEffect, useState, type ReactElement } from "react";

import { fetchLinkPreview } from "../../services/api/link-preview-api";
import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import EnsPreviewCard from "./ens/EnsPreviewCard";
import { isEnsPreview, type EnsPreview } from "./ens/types";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
}

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "ens"; readonly data: EnsPreview }
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
  });

  useEffect(() => {
    let active = true;

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (isEnsPreview(response)) {
          setState({ type: "ens", data: response });
          return;
        }

        const previewData = toPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({ type: "success", data: previewData });
        } else {
          setState({ type: "fallback" });
        }
      })
      .catch((e) => {
        console.error("LinkPreviewCard error", e);
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
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-start">
            {fallbackContent}
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (state.type === "ens") {
    return (
      <LinkPreviewCardLayout href={href}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
          data-testid="ens-preview-card">
          <EnsPreviewCard preview={state.data} />
        </div>
      </LinkPreviewCardLayout>
    );
  }

  const preview = state.type === "success" ? state.data : undefined;

  return <OpenGraphPreview href={href} preview={preview} />;
}
