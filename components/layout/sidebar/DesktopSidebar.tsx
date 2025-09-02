"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useSidebarState } from "@/hooks/useSidebarState";
import DesktopSidebarNav from "./DesktopSidebarNav";
import {
  EllipsisVerticalIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import DropPfp from "@/components/drops/create/utils/DropPfp";
import { DropPartSize } from "@/components/drops/view/part/DropPart";
import HeaderUserProxyDropdown from "@/components/header/user/proxy/HeaderUserProxyDropdown";

export default function DesktopSidebar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const sidebarState = useSidebarState();
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

  // Compute once for reuse
  const collapsed = sidebarState.isMainSidebarCollapsed;
  const displayHandle = profile?.handle
    ? `@${profile.handle}`
    : address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <div
      className={`tw-relative tw-group tw-flex tw-flex-col tw-gap-y-5 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-border-r tw-border-iron-800 tw-border-solid tw-border-t-0 tw-border-b-0 tw-border-l-0 tw-bg-iron-950 tw-h-full tw-pb-6 tw-py-6`}
    >
      <div
        className={`tw-flex tw-shrink-0 tw-items-center tw-justify-start tw-px-1`}
      >
        <Link href="/">
          <Image
            alt="6529Seize"
            src="/6529.png"
            className="tw-h-10 tw-w-10"
            width={40}
            height={40}
          />
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        type="button"
        onClick={sidebarState.toggleMainSidebar}
        className={`tw-absolute tw-top-3 tw-right-0 tw-z-50 tw-bg-iron-300 tw-border tw-border-white tw-rounded-lg tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-300 tw-shadow-lg desktop-hover:hover:tw-shadow-xl`}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={collapsed}
      >
        <ChevronLeftIcon
          className={`tw-h-4 tw-w-4 tw-text-iron-950 tw-transition-transform tw-duration-300 ${
            collapsed ? "tw-rotate-180" : "tw-rotate-0"
          }`}
        />
      </button>

      <DesktopSidebarNav sidebarState={sidebarState} />

      {/* User section at bottom */}
      {address && profile && (
        <div className="tw-mt-auto tw-relative">
          <div
            className={`tw-flex tw-items-center tw-py-2.5 tw-rounded-xl tw-px-3 tw-gap-x-3 tw-text-sm tw-font-semibold tw-text-white desktop-hover:hover:tw-bg-iron-900 tw-justify-start`}
          >
            <DropPfp pfpUrl={profile.pfp} size={DropPartSize.MEDIUM} />
            {!collapsed && (
              <div className="tw-flex-1 tw-hidden lg:tw-block">
                <div className="tw-text-white tw-font-medium tw-text-base">
                  {displayHandle}
                </div>
                <div className="tw-text-iron-400 tw-text-xs">
                  Level {profile.level || 0}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={handleUserMenuToggle}
                className="tw-text-iron-300 desktop-hover:hover:tw-text-white tw-rounded tw-transition-colors tw-bg-transparent tw-border-0 tw-hidden lg:tw-block"
                title={displayHandle || address}
                aria-label="Open user menu"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <EllipsisVerticalIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
              </button>
            )}
          </div>
          <HeaderUserProxyDropdown
            profile={profile}
            isOpen={showUserMenu}
            onClose={handleUserMenuClose}
          />
        </div>
      )}
    </div>
  );
}
