"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import DesktopSidebar from "./sidebar/DesktopSidebar";
import { useSidebarState, SidebarProvider } from "@/hooks/useSidebarState";

interface DesktopLayoutProps {
  readonly children: ReactNode;
}

const DesktopLayoutContent = ({ children }: DesktopLayoutProps) => {
  const { isMainSidebarCollapsed, toggleMainSidebar } = useSidebarState();

  return (
    <div className="tw-relative tw-min-h-dvh tw-w-full">
      <div
        className={`tailwind-scope  tw-fixed tw-inset-y-0 tw-left-0 tw-w-72 tw-z-30
          tw-transform-gpu tw-will-change-transform
          tw-transition-transform tw-duration-300 tw-ease-out
          motion-reduce:tw-transition-none ${
            isMainSidebarCollapsed ? "-tw-translate-x-56" : "tw-translate-x-0"
          }`}
      >
        <DesktopSidebar isCollapsed={isMainSidebarCollapsed} onToggle={toggleMainSidebar} />
      </div>
      <main
        className={`tw-min-h-dvh ${
          isMainSidebarCollapsed ? "tw-pl-16" : "tw-pl-72"
        }`}
      >
        <motion.div
          layout
          initial={false}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 34,
            mass: 0.9,
          }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  return (
    <SidebarProvider>
      <DesktopLayoutContent>{children}</DesktopLayoutContent>
    </SidebarProvider>
  );
};

export default DesktopLayout;
