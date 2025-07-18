export const dynamic = "force-dynamic";

import "@/styles/seize-bootstrap.scss";
import "@/styles/globals.scss";
import "@/styles/swiper.scss";
import "@/styles/Home.module.scss";
import "@/components/drops/create/lexical/lexical.styles.scss";

import Providers from "@/components/providers/Providers";
import { getAppMetadata } from "@/components/providers/metadata";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import StoreSetup from "@/components/providers/StoreSetup";
import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import { Viewport } from "next";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "./error-page";
import Head from "next/head";

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
  return (
    <html lang="en">
      <Head>
        <link rel="preconnect" href={process.env.API_ENDPOINT} />
        <link rel="preconnect" href="https://d3lqz0a4bldqgf.cloudfront.net" />
      </Head>
      <body>
        <StoreSetup>
          <Providers>
            <DynamicHeadTitle />
            <ErrorBoundary fallback={<ErrorPage />}>
              <LayoutWrapper>{children}</LayoutWrapper>
            </ErrorBoundary>
          </Providers>
        </StoreSetup>
      </body>
    </html>
  );
}
