"use client";

import type { ReactNode} from "react";
import { useMemo } from "react";
import { useAuthenticatedContent } from "../../../hooks/useAuthenticatedContent";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import ConnectWallet from "../../common/ConnectWallet";
import UserSetUpProfileCta from "../../user/utils/set-up-profile/UserSetUpProfileCta";
import WavesDesktop from "../WavesDesktop";
import WavesMobile from "../WavesMobile";

// Main layout content that uses the Layout context
function WavesLayoutContent({ children }: { readonly children: ReactNode }) {
  const { contentState } = useAuthenticatedContent();
  const { isApp } = useDeviceInfo();

  const containerClassName =
    "tw-relative tw-flex tw-flex-col tw-flex-1 tailwind-scope";

  const connectPrompt = useMemo(() => {
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
        // Don't show any text for loading states - let the waves content handle its own loading UI
        return null;
      default:
        return null;
    }
  }, [contentState]);

  const content = useMemo(() => {
    if (contentState === "ready") {
      // Include device routing here instead of separate Brain component
      const Component = isApp ? WavesMobile : WavesDesktop;
      return (
        <div className="tw-flex-1" id="waves-content">
          <Component>
            <div className={containerClassName}>{children}</div>
          </Component>
        </div>
      );
    }

    if (contentState === "not-authenticated") {
      return <ConnectWallet />;
    }

    // For other states (needs-profile, not-available)
    if (connectPrompt) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-min-h-screen tw-px-6">
          <div className="tw-flex tw-flex-col tw-items-center tw-text-center tw-gap-4">
            {connectPrompt}
          </div>
        </div>
      );
    }

    // Loading/measuring states
    return null;
  }, [contentState, connectPrompt, containerClassName, children, isApp]);

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-bg-black tw-overflow-hidden">
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
