import React, { ReactNode } from "react";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../header/HeaderPlaceholder";

const Header = dynamic(() => import("../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface DesktopLayoutProps {
  readonly children: ReactNode;
  readonly hideFooter?: boolean;
  readonly isSmall?: boolean;
}


const DesktopLayout = ({ children, isSmall }: DesktopLayoutProps) => {
  return (
    <>
      <Header isSmall={isSmall} />
      <main>{children}</main>
    </>
  );
};

export default DesktopLayout;
