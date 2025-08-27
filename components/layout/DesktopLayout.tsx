"use client";

import React, { ReactNode } from "react";
import DesktopSidebar from "./sidebar/DesktopSidebar";

interface DesktopLayoutProps {
  readonly children: ReactNode;
}

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  return (
    <div className="tw-flex tw-min-h-dvh tw-w-full tw-items-stretch">
      <div className="tailwind-scope tw-relative tw-flex tw-flex-col tw-w-80 tw-h-full">
        <DesktopSidebar />
      </div>
      <main className="tw-flex-1 tw-overflow-auto">{children}</main>
    </div>
  );
};

export default DesktopLayout;
