"use client";

import dynamic from "next/dynamic";
import { useEffect, type ReactNode } from "react";
import { useAuthenticatedContent } from "../../../hooks/useAuthenticatedContent";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import UserSetUpProfileCta from "../../user/utils/set-up-profile/UserSetUpProfileCta";
import WavesMobile from "../WavesMobile";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

type WavesBranchProps = {
  readonly children: ReactNode;
};

function WavesBranchLoadingFallback() {
  return <div className="tw-flex tw-min-h-screen tw-flex-1 tw-bg-black" />;
}

const WavesDesktop = dynamic<WavesBranchProps>(
  () => import("../WavesDesktop"),
  {
    loading: () => <WavesBranchLoadingFallback />,
  }
);

function WavesContentLoadingFallback() {
  const locale = useBrowserLocale();

  return (
    <div
      className="tw-flex tw-h-full tw-min-h-[min(100dvh,720px)] tw-flex-col tw-gap-4 tw-overflow-hidden tw-px-4 tw-py-8 sm:tw-px-6 lg:tw-px-8"
      role="status"
      aria-live="polite"
      aria-label={t(locale, "waves.loadingStatus")}
    >
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-6xl tw-flex-col tw-gap-4">
        <div className="tw-space-y-3">
          <div className="tw-h-5 tw-w-48 tw-animate-pulse tw-rounded tw-bg-iron-800" />
          <div className="tw-h-3 tw-w-full tw-max-w-md tw-animate-pulse tw-rounded tw-bg-iron-900" />
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-3">
          {["left", "middle", "right"].map((column) => (
            <div
              key={`waves-content-loading-${column}`}
              className={`tw-flex tw-flex-col tw-gap-4 ${
                column === "middle" ? "tw-hidden md:tw-flex" : ""
              } ${column === "right" ? "tw-hidden xl:tw-flex" : ""}`}
            >
              {[0, 1, 2].map((item) => (
                <div
                  key={`waves-content-loading-${column}-${item}`}
                  className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/75"
                >
                  <div className="tw-h-44 tw-animate-pulse tw-bg-iron-900" />
                  <div className="tw-space-y-3 tw-p-4">
                    <div className="tw-h-4 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800" />
                    <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded tw-bg-iron-900" />
                    <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-iron-900" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      children:
        contentState === "loading" || contentState === "measuring" ? (
          <WavesContentLoadingFallback />
        ) : (
          children
        ),
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
