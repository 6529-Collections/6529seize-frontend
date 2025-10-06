"use client";

import dynamic from "next/dynamic";
import React, { ReactNode, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import HeaderPlaceholder from "../header/HeaderPlaceholder";
import Breadcrumb from "../breadcrumb/Breadcrumb";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useHeaderContext } from "@/contexts/HeaderContext";

const Header = dynamic(() => import("../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface Props {
  readonly children: ReactNode;
}

export default function SmallScreenLayout({ children }: Props) {
  const { registerRef } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const breadcrumbs = useBreadcrumbs();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      registerRef("header", node);
      setHeaderRef(node);
    },
    [registerRef, setHeaderRef]
  );

  return (
    <div>
      <div ref={headerWrapperRef}>
        <Header />
        {!isHomePage && <Breadcrumb breadcrumbs={breadcrumbs} />}
      </div>
      <main>{children}</main>
    </div>
  );
}
