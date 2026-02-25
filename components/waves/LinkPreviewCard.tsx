"use client";

import { type ReactElement, useEffect, useState } from "react";

import { fetchLinkPreview } from "@/services/api/link-preview-api";

import EnsPreviewCard from "./ens/EnsPreviewCard";
import { type EnsPreview, isEnsPreview } from "./ens/types";
import {
  type LinkPreviewVariant,
  useLinkPreviewVariant,
} from "./LinkPreviewContext";
import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
  readonly variant?: LinkPreviewVariant | undefined;
}

type PreviewState =
  | { readonly type: "loading"; readonly href: string }
  | { readonly type: "fallback"; readonly href: string }
  | {
      readonly type: "success";
      readonly href: string;
      readonly data: OpenGraphPreviewData;
    }
  | { readonly type: "ens"; readonly href: string; readonly data: EnsPreview };

const CHAT_STABLE_FRAME_CLASSES =
  "tw-h-[10rem] tw-min-h-[10rem] tw-max-h-[10rem] tw-w-full md:tw-h-[11rem] md:tw-min-h-[11rem] md:tw-max-h-[11rem]";

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
  variant,
}: LinkPreviewCardProps) {
  const contextVariant = useLinkPreviewVariant();
  const resolvedVariant = variant ?? contextVariant;
  const shouldUseStableFrame = resolvedVariant === "chat";
  const [state, setState] = useState<PreviewState>(() => ({
    type: "loading",
    href,
  }));

  useEffect(() => {
    let active = true;

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        if (isEnsPreview(response)) {
          setState({ type: "ens", data: response, href });
          return;
        }

        const previewData = toPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({ type: "success", data: previewData, href });
          return;
        }

        setState({ type: "fallback", href });
      })
      .catch(() => {
        if (active) {
          setState({ type: "fallback", href });
        }
      });

    return () => {
      active = false;
    };
  }, [href]);

  const isCurrent = state.href === href;
  let content: ReactElement;

  if (isCurrent && state.type === "fallback") {
    const fallbackContent = renderFallback();
    content = (
      <LinkPreviewCardLayout href={href} variant={resolvedVariant}>
        <div
          className={
            resolvedVariant === "home"
              ? "tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-4"
              : "tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
          }
        >
          <div className="tw-[overflow-wrap:anywhere] tw-flex tw-h-full tw-min-h-0 tw-w-full tw-max-w-full tw-items-center tw-justify-start tw-overflow-y-auto tw-break-words">
            {fallbackContent}
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  } else if (isCurrent && state.type === "success") {
    content = (
      <OpenGraphPreview
        href={href}
        preview={state.data}
        variant={resolvedVariant}
      />
    );
  } else if (isCurrent && state.type === "ens") {
    content = (
      <LinkPreviewCardLayout href={href} variant={resolvedVariant}>
        <div
          className={
            resolvedVariant === "home"
              ? "tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-4"
              : "tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
          }
        >
          <div className="tw-h-full tw-min-h-0 tw-overflow-y-auto">
            <EnsPreviewCard preview={state.data} />
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  } else {
    content = (
      <OpenGraphPreview
        href={href}
        preview={undefined}
        variant={resolvedVariant}
      />
    );
  }

  if (!shouldUseStableFrame) {
    return content;
  }

  return (
    <div
      className={CHAT_STABLE_FRAME_CLASSES}
      data-testid="link-preview-card-stable-frame"
    >
      {content}
    </div>
  );
}
