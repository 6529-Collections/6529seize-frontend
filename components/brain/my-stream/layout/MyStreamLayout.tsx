import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import Head from "next/head";
import Brain from "../../Brain";
import { AuthContext } from "../../../auth/Auth";
import { LayoutProvider, useLayout } from "./LayoutContext";
import { MyStreamProvider } from "../../../../contexts/wave/MyStreamContext";
import HeaderUserConnect from "../../../header/user/HeaderUserConnect";
import Image from "next/image";
import { useSeizeConnectContext } from "../../../auth/SeizeConnectContext";
import ClientOnly from "../../../client-only/ClientOnly";
import UserSetUpProfileCta from "../../../user/utils/set-up-profile/UserSetUpProfileCta";
import { useHeaderContext } from "../../../../contexts/HeaderContext";

// Main layout content that uses the Layout context
function MyStreamLayoutContent({ children }: { readonly children: ReactNode }) {
  const { setTitle, title, showWaves, connectedProfile, fetchingProfile } =
    useContext(AuthContext);
  const { registerRef, spaces } = useLayout();
  const { isAuthenticated } = useSeizeConnectContext();
  const { headerRef } = useHeaderContext();

  // Effect to register the header ref from context with the layout context
  useEffect(() => {
    if (headerRef.current) {
      registerRef("header", headerRef.current);
    }
    // Cleanup is likely handled internally by LayoutContext's ResizeObserver unobserve
  }, [headerRef, registerRef]);

  useEffect(() => {
    setTitle({ title: "My Stream | 6529.io" });
  }, [setTitle]); // Added setTitle to dependency array

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

    if (!connectedProfile?.profile?.handle && !fetchingProfile) {
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
    <div className="tw-flex-1" id="my-stream-content">
      <Brain>
        <div className={containerClassName}>{children}</div>
      </Brain>
    </div>
  ) : (
    <div
      id="my-stream-connect"
      className="tw-flex-1 tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-p-6"
    >
      <Image
        priority
        loading="eager"
        src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
        alt="Brain"
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
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="My Stream | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/my-stream`}
        />
        <meta property="og:title" content="My Stream" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
        <meta property="og:description" content="6529.io" />
        {/*  <style>{`body { overflow: hidden !important; }`}</style> */}
      </Head>

      <div className="tailwind-scope tw-min-h-screen tw-flex tw-flex-col tw-bg-black tw-overflow-hidden">
        <ClientOnly>{content}</ClientOnly>
      </div>
    </>
  );
}

export default function MyStreamLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <MyStreamProvider>
      <LayoutProvider>
        <MyStreamLayoutContent>{children}</MyStreamLayoutContent>
      </LayoutProvider>
    </MyStreamProvider>
  );
}
