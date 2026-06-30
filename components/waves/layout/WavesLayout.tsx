"use client";

import dynamic from "next/dynamic";
import { useEffect, type ReactNode } from "react";
import { useAuthenticatedContent } from "../../../hooks/useAuthenticatedContent";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import UserSetUpProfileCta from "../../user/utils/set-up-profile/UserSetUpProfileCta";

type WavesBranchProps = {
  readonly children: ReactNode;
};

function WavesBranchLoadingFallback() {
  return <div className="tw-flex tw-min-h-screen tw-flex-1 tw-bg-black" />;
}

const WavesDesktop = dynamic<WavesBranchProps>(() => import("../WavesDesktop"), {
  loading: () => <WavesBranchLoadingFallback />,
});

const WavesMobile = dynamic<WavesBranchProps>(() => import("../WavesMobile"), {
  loading: () => <WavesBranchLoadingFallback />,
});

function getConnectPrompt(
  contentState: ReturnType<typeof useAuthenticatedContent>["contentState"]
): ReactNode {
  switch (contentState) {
    case "needs-profile":
      return (
        <>
          <h1 className="tw-text-xl tw-font-bold">
            You need to set up a profile to continue.
          </h1>
          <UserSetUpProfileCta />
        </>
      );
    case "not-available":
      return (
        <h1 className="tw-text-xl tw-font-bold">
          This content is not available.
        </h1>
      );
    case "loading":
    case "measuring":
    case "not-authenticated":
    case "ready":
    default:
      return null;
  }
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
    contentState === "ready" ||
    contentState === "not-authenticated" ||
    contentState === "loading" ||
    contentState === "measuring";

  let content: ReactNode = null;

  if (shouldRenderWavesContent) {
    content = getWavesContent({
      children: contentState === "loading" ? null : children,
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
