"use client";

import dynamic from "next/dynamic";
import { useEffect, type ReactNode } from "react";
import { useAuthenticatedContent } from "../../../hooks/useAuthenticatedContent";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import {
  markMobileLaunchStep,
  scheduleMobileLaunchFlush,
} from "../../../utils/monitoring/mobileLaunchTiming";
import WavesMobile from "../WavesMobile";

type WavesBranchProps = {
  readonly children: ReactNode;
};

type WavesContentState = ReturnType<
  typeof useAuthenticatedContent
>["contentState"];

const WAVES_CONTENT_STATE_PUBLIC = "not-authenticated";
const WAVES_CONTENT_STATE_READY = "ready";
const WAVES_CONTENT_STATE_LOADING = "loading";
const WAVES_CONTENT_STATE_MEASURING = "measuring";
const WAVES_CONTENT_STATE_NEEDS_PROFILE = "needs-profile";
const WAVES_CONTENT_STATE_NOT_AVAILABLE = "not-available";

function WavesBranchLoadingFallback() {
  return <div className="tw-flex tw-min-h-screen tw-flex-1 tw-bg-black" />;
}

const WavesDesktop = dynamic<WavesBranchProps>(
  () => import("../WavesDesktop"),
  {
    loading: () => <WavesBranchLoadingFallback />,
  }
);

function getConnectPrompt(contentState: WavesContentState): ReactNode {
  switch (contentState) {
    case WAVES_CONTENT_STATE_NOT_AVAILABLE:
      return (
        <h1 className="tw-text-xl tw-font-bold">
          This content is not available.
        </h1>
      );
    case WAVES_CONTENT_STATE_LOADING:
    case WAVES_CONTENT_STATE_MEASURING:
    case WAVES_CONTENT_STATE_PUBLIC:
    case WAVES_CONTENT_STATE_NEEDS_PROFILE:
    case WAVES_CONTENT_STATE_READY:
    default:
      return null;
  }
}

function isResolvedWavesContentState(contentState: WavesContentState): boolean {
  return (
    contentState === WAVES_CONTENT_STATE_READY ||
    contentState === WAVES_CONTENT_STATE_PUBLIC ||
    contentState === WAVES_CONTENT_STATE_NEEDS_PROFILE ||
    contentState === WAVES_CONTENT_STATE_NOT_AVAILABLE
  );
}

function getWavesContent({
  children,
  containerClassName,
  isApp,
}: {
  readonly children: ReactNode;
  readonly containerClassName: string;
  readonly isApp: boolean;
}): ReactNode {
  const Component = isApp ? WavesMobile : WavesDesktop;

  return (
    <div className="tw-flex-1" id="waves-content">
      <Component>
        <div className={containerClassName}>{children}</div>
      </Component>
    </div>
  );
}

// Main layout content that uses the Layout context
function WavesLayoutContent({ children }: { readonly children: ReactNode }) {
  const { contentState } = useAuthenticatedContent();
  const { isApp } = useDeviceInfo();

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const containerClassName =
    "tw-relative tw-flex tw-flex-col tw-flex-1 tailwind-scope";
  const connectPrompt = getConnectPrompt(contentState);
  const shouldRenderWavesContent =
    contentState === WAVES_CONTENT_STATE_READY ||
    contentState === WAVES_CONTENT_STATE_PUBLIC ||
    contentState === WAVES_CONTENT_STATE_NEEDS_PROFILE ||
    contentState === WAVES_CONTENT_STATE_LOADING ||
    contentState === WAVES_CONTENT_STATE_MEASURING;
  const hasUsefulWavesContent =
    contentState === WAVES_CONTENT_STATE_READY ||
    contentState === WAVES_CONTENT_STATE_PUBLIC ||
    contentState === WAVES_CONTENT_STATE_NEEDS_PROFILE;
  const hasVisibleLaunchContent =
    hasUsefulWavesContent || connectPrompt !== null;

  let content: ReactNode = null;

  if (shouldRenderWavesContent) {
    content = getWavesContent({
      children: contentState === WAVES_CONTENT_STATE_LOADING ? null : children,
      containerClassName,
      isApp,
    });
  } else {
    content =
      connectPrompt === null ? null : (
        <div className="tw-flex tw-min-h-screen tw-items-center tw-justify-center tw-px-6">
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-text-center">
            {connectPrompt}
          </div>
        </div>
      );
  }

  useEffect(() => {
    markMobileLaunchStep("waves_layout_mounted");
  }, []);

  useEffect(() => {
    if (!hasVisibleLaunchContent) {
      return;
    }

    markMobileLaunchStep("waves_first_content_visible");
    scheduleMobileLaunchFlush("waves_content_visible", 250);
  }, [hasVisibleLaunchContent]);

  useEffect(() => {
    if (!isResolvedWavesContentState(contentState)) {
      return;
    }

    markMobileLaunchStep("waves_content_state_resolved");
  }, [contentState]);

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-overflow-hidden tw-bg-black">
      {content}
    </div>
  );
}

export default function WavesLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <WavesLayoutContent>{children}</WavesLayoutContent>;
}
