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

import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import MobileLaunchTimingReporter from "@/components/monitoring/MobileLaunchTimingReporter";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import Providers from "@/components/providers/Providers";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import type { Viewport } from "next";

export const fetchCache = "force-no-store";

export const metadata = getAppMetadata();
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

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href={publicEnv.API_ENDPOINT} crossOrigin="" />
        <link rel="preconnect" href="https://d3lqz0a4bldqgf.cloudfront.net" />
        <link rel="preconnect" href="https://media.artblocks.io" />
        <link rel="preconnect" href="https://media-proxy.artblocks.io" />
        {isUsingStaticAssets && (
          <link rel="preconnect" href="https://dnclu2fna0b2b.cloudfront.net" />
        )}
      </head>
      <body>
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
