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
import { getApiBase } from "@/services/api/api-endpoints";
import { getProductionAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import type { Viewport } from "next";
import localFont from "next/font/local";
import { getMediaResolverSource } from "@/lib/media/decentralized-media";

// Any route that fetches while rendering stays request-time, so its data is
// never frozen at build. Routes that fetch nothing are unaffected. Pages move
// to ISR one by one with their own cache policy, which this blanket setting
// blocks; see "Static Rendering Readiness" in
// ops/docs/developer/next-config-runtime-rationale.md.
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

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const isUsingStaticAssets = publicEnv.ASSETS_FROM_S3 === "true";
  // The shell reads nothing from the request: every visitor gets the same
  // HTML, and the browser decides native iOS, the EULA gate and NFT
  // purchasing. A route that reads no request data and fetches nothing while
  // it renders is prerendered. Wave and chat routes stay request-time in
  // their own segments. See "Static Rendering Readiness" in
  // ops/docs/developer/next-config-runtime-rationale.md.

  return (
    // Headless UI may add its focus-visible marker before React hydrates when
    // keyboard input arrives during startup. Keep that root-only mutation.
    // data-version is the browser's VERSION (config/env.browser.ts), kept out
    // of the bundle so unchanged chunks keep their names across deploys.
    <html
      lang="en-US"
      className={Montserrat.variable}
      data-scroll-behavior="smooth"
      data-version={publicEnv.VERSION}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: NATIVE_STARTUP_STYLES }} />
        {/* Synchronous detection prevents a desktop paint before Next loads. */}
        <script
          id="native-startup-bootstrap"
          dangerouslySetInnerHTML={{ __html: NATIVE_STARTUP_SCRIPT }}
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
        <link rel="preconnect" href={getApiBase()} crossOrigin="" />
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
          <Providers>
            <DynamicHeadTitle />
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </AwsRumProvider>
      </body>
    </html>
  );
}
