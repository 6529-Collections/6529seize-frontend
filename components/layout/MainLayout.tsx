import React, { ReactNode, useEffect, useState } from "react";
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

  return (
    <ClientOnly>
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout hideFooter={hideFooter}>{children}</DesktopLayout>
      )}
    </ClientOnly>
  );
};

export default MainLayout;