import React, { ReactNode } from "react";
import { useRouter } from "next/router";
import useIsMobileScreen from "../../hooks/isMobileScreen";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";
import ClientOnly from "../client-only/ClientOnly";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobileScreen();
  const router = useRouter();
  
  // Pages that shouldn't display the footer
  const hideFooter = ["/waves", "/my-stream", "/open-mobile"].some((path) =>
    router.pathname.startsWith(path)
  );

  // Pages that should use the small header
  const isSmall = router.pathname.startsWith("/my-stream");

  return (
    <ClientOnly>
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout hideFooter={hideFooter} isSmall={isSmall}>
          {children}
        </DesktopLayout>
      )}
    </ClientOnly>
  );
};

export default MainLayout;