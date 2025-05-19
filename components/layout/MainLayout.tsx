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
import { PageSSRMetadata } from "../../helpers/Types";
import { useAuth } from "../auth/Auth";
import { ScrollPositionProvider } from "../../contexts/ScrollPositionContext";

interface MainLayoutProps {
  children: ReactNode;
  metadata: PageSSRMetadata;
}

const MainLayout = ({ children, metadata }: MainLayoutProps) => {
  const router = useRouter();
  const { isMobileDevice, hasTouchScreen, isApp } = useDeviceInfo();
  const isMobile = isMobileDevice || (hasTouchScreen && isApp);
  // Pages that should use the small header
  const isSmall = router.pathname.startsWith("/my-stream");
  const isAccess = router.pathname.startsWith("/access");

  const { title: pageTitle } = useAuth();
  const { title: metadataTitle, description, ogImage, twitterCard } = metadata;

  const ogUrl = `${process.env.BASE_ENDPOINT}${router.asPath}`;

  if (isAccess) {
    return <>{children}</>;
  }

  return (
    <ScrollPositionProvider>
      <ViewProvider>
        <NavigationHistoryProvider>
          <LayoutProvider>
            <Head>
              <title>{pageTitle}</title>
              <link rel="icon" href="/favicon.ico" />
              <meta name="description" content={description} />
              <meta property="og:url" content={ogUrl} />
              <meta property="og:title" content={metadataTitle} />
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
    </ScrollPositionProvider>
  );
};

export default MainLayout;
