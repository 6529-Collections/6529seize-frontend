"use client";

import { ReactNode, useContext, useMemo } from "react";
import Head from "next/head";
import { AuthContext } from "../../auth/Auth";
import { useLayout, LayoutProvider } from "../../brain/my-stream/layout/LayoutContext";
import HeaderUserConnect from "../../header/user/HeaderUserConnect";
import Image from "next/image";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import UserSetUpProfileCta from "../../user/utils/set-up-profile/UserSetUpProfileCta";
import WavesBrain from "../WavesBrain";

// Main layout content that uses the Layout context
function WavesLayoutContent({ children }: { readonly children: ReactNode }) {
  const { showWaves, connectedProfile, fetchingProfile } =
    useContext(AuthContext);
  const { spaces } = useLayout();
  const { isAuthenticated } = useSeizeConnectContext();

  const containerClassName =
    "tw-relative tw-flex tw-flex-col tw-flex-1 tailwind-scope";

  // Determine the exact state we're in - simplified and clear
  const contentState = useMemo(() => {
    // Not authenticated at all - check this FIRST before any loading states
    if (!isAuthenticated) {
      return 'not-authenticated';
    }
    
    // Only check fetching if we're authenticated
    if (fetchingProfile) {
      return 'loading';
    }
    
    // Authenticated but no profile
    if (!connectedProfile?.handle) {
      return 'needs-profile';
    }
    
    // Profile exists but waves not enabled (proxy or other reason)
    if (!showWaves) {
      return 'not-available';
    }
    
    // Everything ready but still measuring layout
    if (!spaces.measurementsComplete) {
      return 'measuring';
    }
    
    // All good, show content
    return 'ready';
  }, [isAuthenticated, fetchingProfile, connectedProfile, showWaves, spaces.measurementsComplete]);

  const connectPrompt = useMemo(() => {
    switch (contentState) {
      case 'not-authenticated':
        return (
          <>
            <h1 className="tw-text-xl tw-font-bold">
              This content is only available to connected wallets.
            </h1>
            <p className="tw-text-base tw-text-gray-400">
              Connect your wallet to continue.
            </p>
            <HeaderUserConnect />
          </>
        );
      case 'needs-profile':
        return (
          <>
            <h1 className="tw-text-xl tw-font-bold">
              You need to set up a profile to continue.
            </h1>
            <UserSetUpProfileCta />
          </>
        );
      case 'not-available':
        return (
          <h1 className="tw-text-xl tw-font-bold">
            This content is not available.
          </h1>
        );
      case 'loading':
      case 'measuring':
        // Don't show any text for loading states - let the waves content handle its own loading UI
        return null;
      default:
        return null;
    }
  }, [contentState]);

  const content = useMemo(() => {
    if (contentState === 'ready') {
      return (
        <div className="tw-flex-1" id="waves-content">
          <WavesBrain>
            <div className={containerClassName}>{children}</div>
          </WavesBrain>
        </div>
      );
    }
    
    return (
      <div
        id="waves-connect"
        className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-px-6 tw-min-h-[85dvh]">
        <Image
          priority
          loading="eager"
          src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
          alt="Waves"
          width={304}
          height={450}
          className="tw-rounded-md tw-shadow-lg tw-max-w-[30vw] md:tw-max-w-[200px] tw-h-auto"
        />
        <div className="tw-flex tw-flex-col tw-items-center md:tw-items-start tw-text-center md:tw-text-left tw-gap-4">
          {connectPrompt}
        </div>
      </div>
    );
  }, [contentState, connectPrompt, containerClassName, children]);

  return (
    <>
      <Head>
        <style>{`body { overflow: hidden !important; }`}</style>
      </Head>
      <div className="tailwind-scope tw-flex tw-flex-col tw-bg-black tw-overflow-hidden">
        {content}
      </div>
    </>
  );
}

export default function WavesLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <LayoutProvider>
      <WavesLayoutContent>{children}</WavesLayoutContent>
    </LayoutProvider>
  );
}