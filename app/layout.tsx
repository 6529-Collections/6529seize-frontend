// Side effect: Overrides globalThis.fetch on server-side to automatically
// add auth headers (x-6529-internal-*) for rate limiter/WAF bypass
import "@/lib/fetch/ssrFetch";
import "@/components/drops/create/lexical/lexical.styles.css";
import "@/styles/Home.module.css";
import "@/styles/fonts.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "@/styles/swiper.css";
//keep this last so that we can override the styles of the above css files
import "@/styles/animations.css";
import "@/styles/globals.css";

import VersionReloadScreen, {
  VERSION_RELOAD_STYLES,
} from "@/components/version-update/VersionReloadScreen";
import { VERSION_RELOAD_BOOTSTRAP_SCRIPT } from "@/components/version-update/versionReload";
import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import { NATIVE_IOS_BOOTSTRAP_SCRIPT } from "@/components/eula/nativeIosBootstrap";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import MobileLaunchTimingReporter from "@/components/monitoring/MobileLaunchTimingReporter";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import {
  NATIVE_STARTUP_SCRIPT,
  NATIVE_STARTUP_STYLES,
} from "@/components/layout/nativeStartup";
import Providers from "@/components/providers/Providers";
import RuntimeFavicon from "@/components/providers/RuntimeFavicon";
import { getAppMetadata } from "@/components/providers/metadata";
import { getProductionAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { CONSENT_EULA_COOKIE, NATIVE_IOS_COOKIE } from "@/constants/constants";
import type { Viewport } from "next";
import { cookies, headers } from "next/headers";
import EnvironmentOriginProvider from "@/components/common/EnvironmentOriginContext";
import { getRequestOrigin } from "@/config/requestOrigin";
import Script from "next/script";

export const fetchCache = "force-no-store";

export const metadata = getAppMetadata();
const productionEnvironment = getProductionAppEnvironment();
export const viewport: Viewport = {
  width: "device-width",
  viewportFit: "cover",
  userScalable: true,
  initialScale: 1,
  maximumScale: 10,
};

export default async function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const isUsingStaticAssets = publicEnv.ASSETS_FROM_S3 === "true";
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const initialOrigin = getRequestOrigin(requestHeaders);
  const initialIsIos = cookieStore.get(NATIVE_IOS_COOKIE)?.value === "true";
  const initialEulaConsentVersion = cookieStore.get(CONSENT_EULA_COOKIE)?.value;

  return (
    // Headless UI may add its focus-visible marker before React hydrates when
    // keyboard input arrives during startup. Keep that root-only mutation.
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: NATIVE_STARTUP_STYLES }} />
        {/* Synchronous detection prevents a desktop paint before Next loads. */}
        <script
          id="native-startup-bootstrap"
          dangerouslySetInnerHTML={{ __html: NATIVE_STARTUP_SCRIPT }}
        />
        <style dangerouslySetInnerHTML={{ __html: VERSION_RELOAD_STYLES }} />
        {/* Restore reload feedback during HTML parsing, before hydration. */}
        <script
          dangerouslySetInnerHTML={{ __html: VERSION_RELOAD_BOOTSTRAP_SCRIPT }}
        />
        <Script
          id="native-ios-platform-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: NATIVE_IOS_BOOTSTRAP_SCRIPT }}
        />
        <link
          data-runtime-favicon="png"
          rel="icon"
          href={productionEnvironment.faviconFallback}
          type="image/png"
          sizes="96x96"
        />
        <link
          data-runtime-favicon="svg"
          rel="icon"
          href={productionEnvironment.favicon}
          type="image/svg+xml"
          sizes="any"
        />
        <link rel="preconnect" href={publicEnv.API_ENDPOINT} crossOrigin="" />
        <link rel="preconnect" href="https://d3lqz0a4bldqgf.cloudfront.net" />
        <link rel="preconnect" href="https://media.artblocks.io" />
        <link rel="preconnect" href="https://media-proxy.artblocks.io" />
        {isUsingStaticAssets && (
          <link rel="preconnect" href="https://dnclu2fna0b2b.cloudfront.net" />
        )}
      </head>
      {/* The touch-first helper may restore data-fine-pointer before hydration. */}
      <body suppressHydrationWarning>
        <VersionReloadScreen />
        <RuntimeFavicon />
        <MobileLaunchTimingReporter />
        <AwsRumProvider>
          <EnvironmentOriginProvider origin={initialOrigin}>
            <Providers
              initialIsIos={initialIsIos}
              initialEulaConsentVersion={initialEulaConsentVersion}
            >
              <DynamicHeadTitle />
              <LayoutWrapper>{children}</LayoutWrapper>
            </Providers>
          </EnvironmentOriginProvider>
        </AwsRumProvider>
      </body>
    </html>
  );
}
