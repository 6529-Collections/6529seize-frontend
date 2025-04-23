import React, { ReactNode, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
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
  readonly isSmall?: boolean;
}

const DesktopLayout = ({ children, isSmall }: DesktopLayoutProps) => {
  const { setHeaderRef } = useHeaderContext();

  const breadcrumbs = useBreadcrumbs();
  const router = useRouter();
  const isHomePage = router.pathname === "/";
  const isStreamView = router.pathname.startsWith('/my-stream');

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
        className={`${isStreamView ? "tw-sticky tw-top-0 tw-z-50 tw-bg-black" : ""}`}
      >
        <Header isSmall={isSmall} />
        {!isHomePage && <Breadcrumb breadcrumbs={breadcrumbs} />}
      </div>
      <main>{children}</main>
    </>
  );
};

export default DesktopLayout;
