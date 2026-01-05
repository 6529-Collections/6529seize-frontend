"use client";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  DocumentTextIcon,
  UserIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useCallback, useEffect, useMemo } from "react";
import { useAppWallets } from "../app-wallets/AppWalletsContext";
import DiscoverIcon from "../common/icons/DiscoverIcon";
import UsersIcon from "../common/icons/UsersIcon";
import AppSidebarHeader from "./AppSidebarHeader";
import AppSidebarMenuItems from "./AppSidebarMenuItems";
import AppUserConnect from "./AppUserConnect";

const MENU = [
  { label: "Profile", path: "/profile", icon: UserIcon },
  { label: "Discover", path: "/discover", icon: DiscoverIcon },
  {
    label: "Network",
    icon: UsersIcon,
    children: [
      { label: "Identities", path: "/network" },
      { label: "Activity", path: "/network/activity" },
      { label: "Groups", path: "/network/groups" },
      { label: "NFT Activity", path: "/nft-activity" },
      { label: "Memes Calendar", path: "/meme-calendar" },
      { label: "TDH", path: "/network/tdh" },
      { label: "Metrics", section: true },
      { label: "Definitions", path: "/network/definitions" },
      { label: "Network Stats", path: "/network/stats" },
      { label: "Levels", path: "/network/levels" },
    ],
  },
  {
    label: "Tools",
    icon: WrenchIcon,
    children: [
      { label: "NFT Delegation", section: true },
      { label: "Delegation Center", path: "/delegation/delegation-center" },
      { label: "Wallet Architecture", path: "/delegation/wallet-architecture" },
      { label: "Delegation FAQ", path: "/delegation/delegation-faq" },
      {
        label: "Consolidation Use Cases",
        path: "/delegation/consolidation-use-cases",
      },
      { label: "Wallet Checker", path: "/delegation/wallet-checker" },
      { label: "The Memes Tools", section: true },
      { label: "Memes Subscriptions", path: "/tools/subscriptions-report" },
      { label: "Meme Accounting", path: "/meme-accounting?focus=the-memes" },
      { label: "Meme Gas", path: "/meme-gas?focus=the-memes" },
      { label: "API", path: "/tools/api", dividerBefore: true },
      { label: "EMMA", path: "/emma" },
      { label: "Block Finder", path: "/tools/block-finder" },
      { label: "Open Data", path: "/open-data" },
    ],
  },
  {
    label: "About",
    icon: DocumentTextIcon,
    children: [
      { label: "NFTs", section: true },
      { label: "The Memes", path: "/about/the-memes" },
      { label: "Subscriptions", path: "/about/subscriptions" },
      { label: "Meme Lab", path: "/about/meme-lab" },
      { label: "Gradient", path: "/about/6529-gradient" },
      { label: "GDRC1", path: "/about/gdrc1", dividerBefore: true },
      { label: "NFT Delegation", section: true },
      { label: "About NFTD", path: "/about/nft-delegation" },
      { label: "Primary Address", path: "/about/primary-address" },
      { label: "6529 Capital", section: true },
      { label: "About 6529 Capital", path: "/capital" },
      { label: "Company Portfolio", path: "/capital/company-portfolio" },
      { label: "NFT Fund", path: "/capital/fund" },
      { label: "Support", section: true },
      { label: "FAQ", path: "/about/faq" },
      { label: "Apply", path: "/about/apply" },
      { label: "Contact Us", path: "/about/contact-us" },
      { label: "Resources", section: true },
      { label: "Data Decentralization", path: "/about/data-decentralization" },
      { label: "ENS", path: "/about/ens" },
      { label: "License", path: "/about/license" },
      { label: "Release Notes", path: "/about/release-notes" },
    ],
  },
];

export default function AppSidebar({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const { appWalletsSupported } = useAppWallets();
  const handleClose = useCallback(() => onClose(), [onClose]);

  const menu = useMemo(() => {
    return MENU.map((item) => {
      if (item.label === "Tools" && item.children) {
        const updatedChildren = [...item.children];

        if (appWalletsSupported) {
          updatedChildren.unshift({
            label: "App Wallets",
            path: "/tools/app-wallets",
          });
        }

        return {
          ...item,
          children: updatedChildren,
        };
      }

      return item;
    });
  }, [appWalletsSupported]);

  // Close on right-to-left swipe
  useEffect(() => {
    if (!open) return;
    let startX: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX || null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startX === null) return;
      const endX = e.changedTouches[0]?.clientX;
      if (endX !== undefined && startX - endX > 80) {
        handleClose();
      }
      startX = null;
    };

    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [open, handleClose]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="tw-fixed tw-inset-0 tw-z-[1010] tw-overflow-hidden tailwind-scope"
        onClose={handleClose}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-ease-out tw-duration-300"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-ease-in tw-duration-200"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50" />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-flex">
          <TransitionChild
            as={Fragment}
            enter="tw-transform tw-ease-out tw-duration-300"
            enterFrom="-tw-translate-x-full"
            enterTo="tw-translate-x-0"
            leave="tw-transform tw-ease-in tw-duration-200"
            leaveFrom="tw-translate-x-0"
            leaveTo="-tw-translate-x-full"
          >
            <DialogPanel className="tw-pointer-events-auto tw-max-w-[22.75rem] tw-w-full tw-h-full tw-bg-iron-950 tw-shadow-xl tw-flex tw-flex-col tw-pt-[env(safe-area-inset-top,0px)] tw-pb-[env(safe-area-inset-bottom,0px)]">
              <AppSidebarHeader onClose={handleClose} />
              <nav className="tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-py-6">
                <div className="tw-flex tw-flex-col tw-h-full">
                  <div className="tw-flex-1 tw-px-2">
                    <AppSidebarMenuItems menu={menu} onNavigate={handleClose} />
                  </div>
                  <div className="tw-px-2 tw-mt-auto tw-border-t tw-border-iron-800 tw-border-solid tw-pt-6 tw-border-b-0 tw-border-x-0">
                    <AppUserConnect onNavigate={handleClose} />
                  </div>
                </div>
              </nav>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
