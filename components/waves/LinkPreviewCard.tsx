"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import {
  fetchLinkPreview,
  type GoogleWorkspaceLinkPreview,
} from "../../services/api/link-preview-api";

import CompoundCard, { toCompoundResponse } from "./compound/CompoundCard";
import type { CompoundResponse } from "./compound/types";
import GoogleWorkspaceCard from "./GoogleWorkspaceCard";


interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
}
type OpenGraphPreviewState = {
  readonly kind: "openGraph";
  readonly data: OpenGraphPreviewData;
};

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "fallback" }
  | { readonly type: "compound"; readonly data: CompoundResponse }
  | {
      readonly type: "success";
      readonly data:
        | OpenGraphPreviewState
        | { readonly kind: "google"; readonly data: GoogleWorkspaceLinkPreview };
    };

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

const isGoogleWorkspacePreview = (
  response: Awaited<ReturnType<typeof fetchLinkPreview>>
): response is GoogleWorkspaceLinkPreview => {
  if (!response || typeof response !== "object") {
    return false;
  }

  const type = (response as { readonly type?: unknown }).type;
  return typeof type === "string" && type.startsWith("google.");
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

        if (isGoogleWorkspacePreview(response)) {
          setState({
            type: "success",
            data: { kind: "google", data: response },
          });
          return;
        }

        const compoundResponse = toCompoundResponse(response);
        if (compoundResponse) {
          setState({ type: "compound", data: compoundResponse });
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

  if (state.type === "compound") {
    return <CompoundCard href={href} response={state.data} />;
  }

  if (state.type === "fallback") {
    const fallbackContent = renderFallback();

    return (
      <LinkPreviewCardLayout href={href}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
        >
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-start">
            {fallbackContent}
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (state.type === "success") {
    if (state.data.kind === "google") {
      return <GoogleWorkspaceCard href={href} data={state.data.data} />;
    }

    return <OpenGraphPreview href={href} preview={state.data.data} />;
  }

  return <OpenGraphPreview href={href} preview={undefined} />;
}
