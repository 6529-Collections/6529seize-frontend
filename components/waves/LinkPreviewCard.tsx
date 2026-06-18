"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  getFirstPartyOpenGraphPreviewKind,
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import { fetchLinkPreview } from "@/services/api/link-preview-api";
import EnsPreviewCard from "./ens/EnsPreviewCard";
import { isEnsPreview, type EnsPreview } from "./ens/types";
import {
  useLinkPreviewVariant,
  type LinkPreviewVariant,
} from "./LinkPreviewContext";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly hideActions?: boolean | undefined;
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
const CHAT_FALLBACK_FRAME_CLASSES = "tw-min-h-[4.5rem] tw-w-full";
const CHAT_FIRST_PARTY_FRAME_CLASSES =
  "tw-h-[15rem] tw-min-h-[15rem] tw-max-h-[15rem] tw-w-full lg:tw-h-[11rem] lg:tw-min-h-[11rem] lg:tw-max-h-[11rem]";
const CHAT_COLLECTION_FRAME_CLASSES =
  "tw-min-h-[11rem] tw-w-full md:tw-min-h-[12rem]";
const CHAT_VIDEO_FRAME_CLASSES =
  "tw-min-h-[18rem] tw-w-full sm:tw-min-h-[14rem] md:tw-min-h-[15rem]";
const CHAT_FARCASTER_FRAME_CLASSES =
  "tw-min-h-[24rem] tw-w-full sm:tw-min-h-[13rem] md:tw-min-h-[14rem]";

const isSeizeCollectionPreview = (
  preview: OpenGraphPreviewData | null | undefined
): boolean => preview?.["type"] === "6529.collection";

const isYoutubeVideoPreview = (
  preview: OpenGraphPreviewData | null | undefined
): boolean => preview?.["type"] === "youtube.video";

const isFarcasterEmbedPreview = (
  preview: OpenGraphPreviewData | null | undefined
): boolean =>
  preview?.["type"] === "farcaster.miniapp" ||
  preview?.["type"] === "farcaster.frame";

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
  hideActions = false,
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
      <LinkPreviewCardLayout
        href={href}
        hideActions={hideActions}
        variant={resolvedVariant}
      >
        <div
          className={
            resolvedVariant === "home"
              ? "tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-4"
              : "tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-transparent"
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
        hideActions={hideActions}
        href={href}
        preview={state.data}
        variant={resolvedVariant}
      />
    );
  } else if (isCurrent && state.type === "ens") {
    content = (
      <LinkPreviewCardLayout
        href={href}
        hideActions={hideActions}
        variant={resolvedVariant}
      >
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
        hideActions={hideActions}
        href={href}
        preview={undefined}
        variant={resolvedVariant}
      />
    );
  }

  if (!shouldUseStableFrame) {
    return content;
  }

  let stableFrameClasses = CHAT_STABLE_FRAME_CLASSES;
  if (isCurrent && state.type === "fallback") {
    stableFrameClasses = CHAT_FALLBACK_FRAME_CLASSES;
  } else if (isCurrent && state.type === "success") {
    if (getFirstPartyOpenGraphPreviewKind(state.data)) {
      stableFrameClasses = CHAT_FIRST_PARTY_FRAME_CLASSES;
    } else if (isSeizeCollectionPreview(state.data)) {
      stableFrameClasses = CHAT_COLLECTION_FRAME_CLASSES;
    } else if (isYoutubeVideoPreview(state.data)) {
      stableFrameClasses = CHAT_VIDEO_FRAME_CLASSES;
    } else if (isFarcasterEmbedPreview(state.data)) {
      stableFrameClasses = CHAT_FARCASTER_FRAME_CLASSES;
    }
  }

  return (
    <div
      className={stableFrameClasses}
      data-testid="link-preview-card-stable-frame"
    >
      {content}
    </div>
  );
}
