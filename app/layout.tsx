export const dynamic = "force-dynamic";

import "@/components/drops/create/lexical/lexical.styles.scss";
import "@/styles/Home.module.scss";
import "@/styles/seize-bootstrap.scss";
import "@/styles/swiper.scss";
//keep this last so that we can override the styles of the above css files
import "@/styles/globals.scss";

import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import Providers from "@/components/providers/Providers";
import StoreSetup from "@/components/providers/StoreSetup";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { Viewport } from "next";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "./error-page";

export const metadata = getAppMetadata();
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const isUsingStaticAssets = publicEnv.ASSETS_FROM_S3 === "true";

  return (
    <html lang="en">
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
        <AwsRumProvider>
          <StoreSetup>
            <Providers>
              <DynamicHeadTitle />
              <ErrorBoundary fallback={<ErrorPage />}>
                <LayoutWrapper>{children}</LayoutWrapper>
              </ErrorBoundary>
            </Providers>
          </StoreSetup>
        </AwsRumProvider>
      </body>
    </html>
  );
}
