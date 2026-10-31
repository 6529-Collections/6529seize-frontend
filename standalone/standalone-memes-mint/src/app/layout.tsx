import "@/components/drops/create/lexical/lexical.styles.css";
import "@/styles/Home.module.css";
import "@/styles/fonts.css";
import "@/styles/animations.css";
import "@/styles/globals.css";

import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import Providers from "@/components/providers/Providers";
import { getAppMetadata } from "@/components/providers/metadata";
import { getProductionAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { SeizeSettingsMode } from "@/types/enums";
import type { Viewport } from "next";

// Test exports (export-mint-page --test) stay out of search indexes. Prod
// exports leave robots unset, so their metadata is unchanged.
export const metadata = getAppMetadata(undefined, {
  robots: publicEnv.STANDALONE_TEST_BUILD
    ? { index: false, follow: false }
    : undefined,
});
export const viewport: Viewport = {
  width: "device-width",
  viewportFit: "cover",
  userScalable: true,
  initialScale: 1,
  maximumScale: 10,
};

const productionEnvironment = getProductionAppEnvironment();

// Static export: also covers the generated /_not-found page, so providers that
// call useSearchParams() render with empty params instead of failing the build.
export const dynamic = "force-static";

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* The PNG goes first so browsers that support SVG prefer it. */}
        <link
          rel="icon"
          href={productionEnvironment.faviconFallback}
          type="image/png"
          sizes="96x96"
        />
        <link
          rel="icon"
          href={productionEnvironment.favicon}
          type="image/svg+xml"
          sizes="any"
        />
        <link rel="preconnect" href={publicEnv.API_ENDPOINT} crossOrigin="" />
      </head>
      <body>
        <Providers
          enableVersionCheck={false}
          enableWalletAuthentication={false}
          enableCookieConsent={false}
          enableMyStream={false}
          settingsMode={SeizeSettingsMode.LOCAL}
        >
          <DynamicHeadTitle />
          {children}
        </Providers>
      </body>
    </html>
  );
}
