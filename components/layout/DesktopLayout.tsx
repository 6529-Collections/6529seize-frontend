import React, { ReactNode, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../header/HeaderPlaceholder";
import { useHeaderContext } from "../../contexts/HeaderContext";
import Breadcrumb from "../breadcrumb/Breadcrumb";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";

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
  const { setHeaderRef } = useHeaderContext();

  const breadcrumbs = useBreadcrumbs();

  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      setHeaderRef(node);
    },
    [setHeaderRef]
  );

  return (
    <>
      <div
        ref={headerWrapperRef}
        className="tw-sticky tw-top-0 tw-z-50 tw-bg-black"
      >
        <Header isSmall={isSmall} />
        <Breadcrumb breadcrumbs={breadcrumbs} />
      </div>
      <main>{children}</main>
    </>
  );
};

export default DesktopLayout;
