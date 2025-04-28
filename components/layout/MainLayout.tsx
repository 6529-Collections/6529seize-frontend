import React, { ReactNode } from "react";
import { useRouter } from "next/router";
import useIsMobileScreen from "../../hooks/isMobileScreen";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";
import ClientOnly from "../client-only/ClientOnly";
import { ViewProvider } from "../navigation/ViewContext";
import { MyStreamProvider } from "../../contexts/wave/MyStreamContext";
import { LayoutProvider } from "../brain/my-stream/layout/LayoutContext";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobileScreen();
  const router = useRouter();

  // Pages that should use the small header
  const isSmall = router.pathname.startsWith("/my-stream");

  return (
    <ViewProvider>
      <LayoutProvider>
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
    </ViewProvider>
  );
};

export default MainLayout;
