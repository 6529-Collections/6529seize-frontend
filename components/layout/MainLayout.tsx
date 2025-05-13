import React, { ReactNode } from "react";
import { useRouter } from "next/router";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";
import ClientOnly from "../client-only/ClientOnly";
import { ViewProvider } from "../navigation/ViewContext";
import { NavigationHistoryProvider } from "../../contexts/NavigationHistoryContext";
import { MyStreamProvider } from "../../contexts/wave/MyStreamContext";
import { LayoutProvider } from "../brain/my-stream/layout/LayoutContext";
import Head from "next/head";

export interface Metadata {
  title: string;
  description: string;
  ogImage: string;
  ogUrl: string;
  twitterCard: "summary" | "summary_large_image";
}

interface MainLayoutProps {
  children: ReactNode;
  metadata: Metadata;
}

const MainLayout = ({ children, metadata }: MainLayoutProps) => {
  const router = useRouter();
  const { isMobileDevice, hasTouchScreen, isApp } = useDeviceInfo();
  const isMobile = isMobileDevice || (hasTouchScreen && isApp);
  // Pages that should use the small header
  const isSmall = router.pathname.startsWith("/my-stream");
  const isAccess = router.pathname.startsWith("/access");

  const { title, description, ogImage, ogUrl, twitterCard } = metadata;

  if (isAccess) {
    return <>{children}</>;
  }

  return (
    <ViewProvider>
      <NavigationHistoryProvider>
        <LayoutProvider>
          <Head>
            <title>{title}</title>
            <link rel="icon" href="/favicon.ico" />
            <meta name="description" content={description} />
            <meta property="og:url" content={ogUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta name="twitter:card" content={twitterCard} />
          </Head>
          <ClientOnly>
            <MyStreamProvider>
              {isMobile ? (
                <MobileLayout>{children}</MobileLayout>
              ) : (
                <DesktopLayout isSmall={isSmall}>{children}</DesktopLayout>
              )}
            </MyStreamProvider>
          </ClientOnly>
        </LayoutProvider>
      </NavigationHistoryProvider>
    </ViewProvider>
  );
};

export default MainLayout;
