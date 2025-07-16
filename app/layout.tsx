export const dynamic = "force-dynamic";

import "@/styles/seize-bootstrap.scss";
import "@/styles/globals.scss";
import "@/styles/swiper.scss";
import "@/styles/Home.module.scss";
import "@/components/drops/create/lexical/lexical.styles.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import Providers from "@/components/providers/Providers";
import { getAppMetadata } from "@/components/providers/metadata";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import StoreSetup from "@/components/providers/StoreSetup";
import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import { Viewport } from "next";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "./error-page";
import Head from "next/head";
import { SplashScreen } from "@capacitor/splash-screen";
import { App as CapacitorApp } from "@capacitor/app";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { initDeepLink } from "@/helpers/deep-link.helpers";

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
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function startup() {
      await initDeepLink(router);
      setReady(true);
    }
    startup();
  }, [router]);

  if (!ready) {
    return null;
  }

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
