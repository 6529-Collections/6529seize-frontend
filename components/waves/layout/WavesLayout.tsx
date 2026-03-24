"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { useAuthenticatedContent } from "../../../hooks/useAuthenticatedContent";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import ConnectWallet from "../../common/ConnectWallet";
import HeaderUserConnect from "../../header/user/HeaderUserConnect";
import UserSetUpProfileCta from "../../user/utils/set-up-profile/UserSetUpProfileCta";
import WavesDesktop from "../WavesDesktop";
import WavesMobile from "../WavesMobile";
import PublicWaveShell from "../public/PublicWaveShell";
import WaveScreenMessage from "../WaveScreenMessage";

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

function getNotAuthenticatedContent({
  activeWaveId,
  containerClassName,
  isApp,
  isMobileDevice,
}: {
  readonly activeWaveId: string | null;
  readonly containerClassName: string;
  readonly isApp: boolean;
  readonly isMobileDevice: boolean;
}): ReactNode {
  if (isApp || (isMobileDevice && activeWaveId === null)) {
    return <ConnectWallet />;
  }

  return (
    <div className="tw-flex-1" id="waves-content">
      <WavesDesktop
        allowDropOverlay={false}
        allowRightSidebar={false}
        showLeftSidebar={true}
      >
        <div className={containerClassName}>
          {activeWaveId === null ? (
            <WaveScreenMessage
              title="Select a Wave"
              description="Connect your wallet to access wave and join the conversation."
              action={<HeaderUserConnect label="Connect Wallet" />}
            />
          ) : (
            <PublicWaveShell waveId={activeWaveId} />
          )}
        </div>
      </WavesDesktop>
    </div>
  );
}

// Main layout content that uses the Layout context
function WavesLayoutContent({ children }: { readonly children: ReactNode }) {
  const { contentState } = useAuthenticatedContent();
  const { isApp, isMobileDevice } = useDeviceInfo();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeWaveId = getActiveWaveIdFromUrl({ pathname, searchParams });

  const containerClassName =
    "tw-relative tw-flex tw-flex-col tw-flex-1 tailwind-scope";
  const connectPrompt = getConnectPrompt(contentState);

  let content: ReactNode = null;

  if (contentState === "ready") {
    const Component = isApp ? WavesMobile : WavesDesktop;
    content = (
      <div className="tw-flex-1" id="waves-content">
        <Component>
          <div className={containerClassName}>{children}</div>
        </Component>
      </div>
    );
  } else if (contentState === "not-authenticated") {
    content = getNotAuthenticatedContent({
      activeWaveId,
      containerClassName,
      isApp,
      isMobileDevice,
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
