import "@/components/drops/create/lexical/lexical.styles.scss";
import "@/styles/Home.module.scss";
import "@/styles/seize-bootstrap.scss";
import "swiper/css";
import "@/styles/swiper.scss";
import "@/styles/animations.scss";
import "@/styles/globals.scss";

import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import Providers from "@/components/providers/Providers";
import StoreSetup from "@/components/providers/StoreSetup";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import type { Viewport } from "next";
import StandaloneAnchorInterceptor from "../components/StandaloneAnchorInterceptor";

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
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href={publicEnv.API_ENDPOINT} crossOrigin="" />
      </head>
      <body>
        <StoreSetup>
          <Providers
            enableVersionCheck={false}
            enableWalletAuthentication={false}
            enableCookieConsent={false}
            enableMyStream={false}
          >
            <StandaloneAnchorInterceptor />
            <DynamicHeadTitle />
            {children}
          </Providers>
        </StoreSetup>
      </body>
    </html>
  );
}
