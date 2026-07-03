import "@/components/drops/create/lexical/lexical.styles.css";
import "@/styles/Home.module.css";
import "@/styles/fonts.css";
import "@/styles/animations.css";
import "@/styles/globals.css";

import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import Providers from "@/components/providers/Providers";
import StoreSetup from "@/components/providers/StoreSetup";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { SeizeSettingsMode } from "@/types/enums";
import type { Viewport } from "next";

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
            settingsMode={SeizeSettingsMode.LOCAL}
          >
            <DynamicHeadTitle />
            {children}
          </Providers>
        </StoreSetup>
      </body>
    </html>
  );
}
