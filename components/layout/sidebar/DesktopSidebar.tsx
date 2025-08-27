"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useIdentity } from "@/hooks/useIdentity";
import DesktopSidebarNav from "./DesktopSidebarNav";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import DropPfp from "@/components/drops/create/utils/DropPfp";
import { DropPartSize } from "@/components/drops/view/part/DropPart";
import HeaderUserProxyDropdown from "@/components/header/user/proxy/HeaderUserProxyDropdown";

export default function DesktopSidebar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { address } = useSeizeConnectContext();

  const { profile } = useIdentity({
    handleOrWallet: address || "",
    initialProfile: null,
  });

  return (
    <div className="tw-flex tw-grow tw-flex-col tw-gap-y-5 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-desktop-hover:hover:desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-border-r tw-border-iron-700 tw-bg-iron-950 tw-fixed tw-inset-y-0 tw-z-50 tw-w-16 lg:tw-w-80  tw-px-3 lg:tw-px-6 tw-pb-6">
      <div className="tw-flex tw-h-16 tw-shrink-0 tw-items-center tw-justify-center lg:tw-justify-start">
        <Link href="/">
          <Image
            alt="6529Seize"
            src="/6529.png"
            className="tw-h-8 tw-w-8"
            width={32}
            height={32}
          />
        </Link>
      </div>

      <DesktopSidebarNav />

      {/* User section at bottom */}
      {address && profile && (
        <div className="tw-mt-auto tw-relative">
          <div className="tw-flex tw-items-center tw-py-2.5 tw-rounded-xl tw-px-3 tw-gap-x-3 tw-text-sm tw-font-semibold tw-text-white desktop-hover:hover:tw-bg-iron-900 tw-justify-center lg:tw-justify-start">
            <DropPfp pfpUrl={profile.pfp} size={DropPartSize.MEDIUM} />
            <div className="tw-flex-1 tw-hidden lg:tw-block">
              <div className="tw-text-white tw-font-medium tw-text-base">
                {profile.handle
                  ? `@${profile.handle}`
                  : `${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
              <div className="tw-text-iron-400 tw-text-xs">
                Level {profile.level || 0}
              </div>
            </div>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="tw-text-iron-300 desktop-hover:hover:tw-text-white tw-p-1 tw-rounded tw-transition-colors tw-bg-transparent tw-border-0"
              title={profile.handle ? `@${profile.handle}` : address}
            >
              <EllipsisVerticalIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
            </button>
          </div>
          <HeaderUserProxyDropdown
            profile={profile}
            isOpen={showUserMenu}
            onClose={() => setShowUserMenu(false)}
          />
        </div>
      )}
    </div>
  );
}
