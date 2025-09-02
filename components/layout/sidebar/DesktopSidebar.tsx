"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useSidebarState } from "@/hooks/useSidebarState";
import DesktopSidebarNav from "./DesktopSidebarNav";
import {
  EllipsisVerticalIcon,
  ChevronDoubleLeftIcon,
} from "@heroicons/react/24/outline";
import DropPfp from "@/components/drops/create/utils/DropPfp";
import { DropPartSize } from "@/components/drops/view/part/DropPart";
import HeaderUserProxyDropdown from "@/components/header/user/proxy/HeaderUserProxyDropdown";

interface DesktopSidebarProps {
  isCollapsed: boolean;
}

function DesktopSidebar({ isCollapsed }: DesktopSidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { toggleMainSidebar } = useSidebarState();
  const { address } = useSeizeConnectContext();

  const handleUserMenuToggle = () => {
    setShowUserMenu((prev) => !prev);
  };

  const handleUserMenuClose = () => {
    setShowUserMenu(false);
  };

  const { profile } = useIdentity({
    handleOrWallet: address || "",
    initialProfile: null,
  });

  const displayHandle =
    profile?.handle && profile.handle.trim()
      ? profile.handle
      : address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "";

  return (
    <div
      className="tw-flex tw-flex-col tw-gap-y-5 tw-w-80 tw-h-full tw-overflow-y-auto 
        tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 
        desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-border-r tw-border-iron-700 
        tw-border-solid tw-bg-iron-950 tw-py-6"
    >
      <div
        className={`tw-flex tw-flex-col tw-h-full ${
          isCollapsed ? "tw-ml-auto tw-w-16 tw-px-2" : "tw-w-80 tw-px-4"
        }`}
      >
        <div
          className={`tw-flex tw-shrink-0 tw-items-center ${
            isCollapsed ? "tw-justify-center" : "tw-justify-between tw-px-3"
          }`}
        >
          {!isCollapsed && (
            <Link href="/">
              <Image
                alt="6529Seize"
                src="/6529.png"
                className="tw-h-10 tw-w-10"
                width={40}
                height={40}
              />
            </Link>
          )}

          <button
            type="button"
            onClick={toggleMainSidebar}
            className="tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-900 
              tw-border tw-border-solid tw-border-iron-700 tw-shadow-md tw-shadow-black/10
              tw-transition-all tw-duration-300 tw-ease-out
              desktop-hover:hover:tw-from-iron-750 desktop-hover:hover:tw-to-iron-850 
              desktop-hover:hover:tw-border-iron-650 desktop-hover:hover:tw-shadow-lg 
              desktop-hover:hover:tw-shadow-black/15 desktop-hover:hover:tw-scale-105
              active:tw-scale-95 active:tw-shadow-sm"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="tw-absolute tw-inset-0 tw-rounded-lg tw-bg-gradient-to-br tw-from-white/10 tw-to-transparent tw-opacity-0 group-hover:tw-opacity-100 tw-transition-all tw-duration-300" />
            <ChevronDoubleLeftIcon
              className={`tw-relative tw-h-4 tw-w-4 tw-text-iron-200 group-hover:tw-text-white tw-transition-all tw-duration-300 tw-drop-shadow-sm ${
                isCollapsed ? "tw-rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <DesktopSidebarNav isCollapsed={isCollapsed} />

        {/* User section at bottom */}
        {address && profile && (
          <div className="tw-mt-auto tw-relative">
            <button
              onClick={handleUserMenuToggle}
              className={`tw-bg-transparent tw-border-none tw-flex tw-items-center tw-w-full tw-py-2.5 tw-rounded-xl tw-gap-x-3 tw-text-sm tw-font-semibold tw-text-white desktop-hover:hover:tw-bg-iron-900 ${
                isCollapsed
                  ? "tw-justify-center tw-px-2 tw-items-center"
                  : "tw-justify-start tw-px-3 tw-items-start"
              }`}
            >
              <DropPfp pfpUrl={profile.pfp} size={DropPartSize.MEDIUM} />
              {!isCollapsed && (
                <div className="tw-hidden lg:tw-flex tw-flex-col tw-space-y-1.5">
                  <div className="tw-text-white tw-font-medium tw-text-base tw-leading-tight">
                    {displayHandle}
                  </div>
                  <div className="tw-text-iron-400 tw-text-xs tw-leading-tight">
                    Level {profile.level || 0}
                  </div>
                </div>
              )}
              {!isCollapsed && (
                <div
                  className="tw-ml-auto tw-text-iron-300 desktop-hover:hover:tw-text-white tw-rounded tw-transition-colors tw-bg-transparent tw-border-0 tw-hidden lg:tw-block"
                  title={displayHandle || address}
                  aria-label="Open user menu"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <EllipsisVerticalIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                </div>
              )}
            </button>
            <HeaderUserProxyDropdown
              profile={profile}
              isOpen={showUserMenu}
              onClose={handleUserMenuClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(DesktopSidebar);
