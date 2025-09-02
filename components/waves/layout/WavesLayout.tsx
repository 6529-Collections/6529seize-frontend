"use client";

import { ReactNode, useContext, useMemo } from "react";
import Head from "next/head";
import { AuthContext } from "../../auth/Auth";
import { useLayout, LayoutProvider } from "../../brain/my-stream/layout/LayoutContext";
import HeaderUserConnect from "../../header/user/HeaderUserConnect";
import Image from "next/image";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import ClientOnly from "../../client-only/ClientOnly";
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

  const shouldShowContent = useMemo(
    () => showWaves && spaces.measurementsComplete,
    [showWaves, spaces.measurementsComplete]
  );

  const connectPrompt = useMemo(() => {
    if (!isAuthenticated) {
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
    }

    if (!connectedProfile?.handle && !fetchingProfile) {
      return (
        <>
          <h1 className="tw-text-xl tw-font-bold">
            You need to set up a profile to continue.
          </h1>
          <UserSetUpProfileCta />
        </>
      );
    }

    return (
      <h1 className="tw-text-xl tw-font-bold tw-animate-pulse">Loading...</h1>
    );
  }, [isAuthenticated, connectedProfile, fetchingProfile]);

  const content = shouldShowContent ? (
    <div className="tw-flex-1" id="waves-content">
      <WavesBrain>
        <div className={containerClassName}>{children}</div>
      </WavesBrain>
    </div>
  ) : (
    <div
      id="waves-connect"
      className="tw-flex-1 tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-min-h-[80dvh] tw-p-6">
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

  return (
    <>
      <Head>
        <style>{`body { overflow: hidden !important; }`}</style>
      </Head>
      <div className="tailwind-scope tw-flex tw-flex-col tw-bg-black tw-overflow-hidden">
        <ClientOnly>{content}</ClientOnly>
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