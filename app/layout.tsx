// Side effect: Overrides globalThis.fetch on server-side to automatically
// add auth headers (x-6529-internal-*) for rate limiter/WAF bypass
import "@/lib/fetch/ssrFetch";
import "@/components/drops/create/lexical/lexical.styles.css";
import "@/styles/Home.module.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "@/styles/swiper.css";
import "@/styles/wave-navigation-transition.css";
//keep this last so that we can override the styles of the above css files
import "@/styles/animations.css";
import "@/styles/globals.css";

import VersionReloadScreen, {
  VERSION_RELOAD_STYLES,
} from "@/components/version-update/VersionReloadScreen";
import { VERSION_RELOAD_BOOTSTRAP_SCRIPT } from "@/components/version-update/versionReload";
import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import { NATIVE_IOS_BOOTSTRAP_SCRIPT } from "@/components/eula/nativeIosBootstrap";
import { canServerRenderNftPurchasing } from "@/components/common/nftPurchasingRequest";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import MobileLaunchTimingReporter from "@/components/monitoring/MobileLaunchTimingReporter";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import {
  NATIVE_STARTUP_SCRIPT,
  NATIVE_STARTUP_STYLES,
} from "@/components/layout/nativeStartup";
import {
  SIDEBAR_STARTUP_SCRIPT,
  SIDEBAR_STARTUP_STYLES,
} from "@/components/layout/sidebarStartup";
import {
  SMALL_WEB_STARTUP_SCRIPT,
  SMALL_WEB_STARTUP_STYLES,
} from "@/components/layout/smallWebStartup";
import Providers from "@/components/providers/Providers";
import RuntimeFavicon from "@/components/providers/RuntimeFavicon";
import { getAppMetadata } from "@/components/providers/metadata";
import { getProductionAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { CONSENT_EULA_COOKIE, NATIVE_IOS_COOKIE } from "@/constants/constants";
import type { Viewport } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import EnvironmentOriginProvider from "@/components/common/EnvironmentOriginContext";
import { getRequestOrigin } from "@/config/requestOrigin";
import { getMediaResolverSource } from "@/lib/media/decentralized-media";

export const fetchCache = "force-no-store";

// Loaded here so every route preloads the font from the HTML instead of
// discovering it from the stylesheet, with a size-adjusted fallback while it
// swaps in. The variable name becomes the generated family name
// ("Montserrat"), which font checks in tests rely on; styles use it through
// --font-montserrat.
const Montserrat = localFont({
  src: "../assets/montserrat/Montserrat-VariableFont_wght.woff2",
  display: "swap",
  variable: "--font-montserrat",
});

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
  // Routes render per request by default. A page that exports
  // `dynamic = "force-static"` is prerendered and sees empty cookies and
  // headers here; the shell then resolves native iOS EULA state in the
  // browser and uses the configured origin for the environment badge.
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const initialOrigin = getRequestOrigin(
    requestHeaders,
    publicEnv.BASE_ENDPOINT
  );
  const initialIsIos = cookieStore.get(NATIVE_IOS_COOKIE)?.value === "true";
  const initialEulaConsentVersion = cookieStore.get(CONSENT_EULA_COOKIE)?.value;
  const serverRendersNftPurchasing = canServerRenderNftPurchasing({
    hasNativeIosCookie: cookieStore.has(NATIVE_IOS_COOKIE),
    userAgent: requestHeaders.get("user-agent"),
  });

  return (
    // Headless UI may add its focus-visible marker before React hydrates when
    // keyboard input arrives during startup. Keep that root-only mutation.
    <html
      lang="en-US"
      className={Montserrat.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: NATIVE_STARTUP_STYLES }} />
        {/* Synchronous detection prevents a desktop paint before Next loads. */}
        <script
          id="native-startup-bootstrap"
          dangerouslySetInnerHTML={{ __html: NATIVE_STARTUP_SCRIPT }}
        />
        {/* Synchronous too: reload with the iOS marker before the app JS downloads. */}
        <script
          id="native-ios-platform-bootstrap"
          dangerouslySetInnerHTML={{ __html: NATIVE_IOS_BOOTSTRAP_SCRIPT }}
        />
        <style dangerouslySetInnerHTML={{ __html: SMALL_WEB_STARTUP_STYLES }} />
        <script
          id="small-web-startup-bootstrap"
          dangerouslySetInnerHTML={{ __html: SMALL_WEB_STARTUP_SCRIPT }}
        />
        <style dangerouslySetInnerHTML={{ __html: SIDEBAR_STARTUP_STYLES }} />
        <script
          id="sidebar-startup-bootstrap"
          dangerouslySetInnerHTML={{ __html: SIDEBAR_STARTUP_SCRIPT }}
        />
        <style dangerouslySetInnerHTML={{ __html: VERSION_RELOAD_STYLES }} />
        {/* Restore reload feedback during HTML parsing, before hydration. */}
        <script
          dangerouslySetInnerHTML={{ __html: VERSION_RELOAD_BOOTSTRAP_SCRIPT }}
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
        <link
          rel="preconnect"
          href={getMediaResolverSource(publicEnv.MEDIA_RESOLVER_ENDPOINT)}
        />
        {isUsingStaticAssets && (
          <>
            <link
              rel="preconnect"
              href="https://dnclu2fna0b2b.cloudfront.net"
            />
            {/* Fonts are CORS requests and cannot reuse the connection above. */}
            <link
              rel="preconnect"
              href="https://dnclu2fna0b2b.cloudfront.net"
              crossOrigin=""
            />
          </>
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
              canServerRenderNftPurchasing={serverRendersNftPurchasing}
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
