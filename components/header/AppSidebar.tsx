"use client";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Fragment, useCallback, useEffect, useMemo } from "react";
import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import useCapacitor from "@/hooks/useCapacitor";
import { useSidebarSections } from "@/hooks/useSidebarSections";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { appendDropForgeToAbout } from "@/components/navigation/sidebarSectionUtils";
import { useAppWallets } from "../app-wallets/AppWalletsContext";
import ChatBubbleIcon from "../common/icons/ChatBubbleIcon";
import AppSidebarHeader from "./AppSidebarHeader";
import AppSidebarMenuItems from "./AppSidebarMenuItems";
import AppUserConnect from "./AppUserConnect";

type SidebarMenu = Parameters<typeof AppSidebarMenuItems>[0]["menu"];

type SidebarMenuChildren = NonNullable<SidebarMenu[number]["children"]>;

function mapSectionToMenuItem(section: SidebarSection): SidebarMenu[number] {
  const children: SidebarMenuChildren = [
    ...section.items.map((item) => ({
      label: item.name,
      path: item.href,
    })),
    ...(section.subsections?.flatMap(
      (subsection): SidebarMenuChildren => [
        { label: subsection.name, section: true },
        ...subsection.items.map((item) => ({
          label: item.name,
          path: item.href,
        })),
      ]
    ) ?? []),
  ];

  return {
    label: section.name,
    icon: section.icon,
    children,
  };
}

export default function AppSidebar({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const { appWalletsSupported } = useAppWallets();
  const { canAccessLanding: showDropForge } = useDropForgePermissions();
  const capacitor = useCapacitor();
  const cookieConsent = useOptionalCookieConsent();
  const sections = useSidebarSections(
    appWalletsSupported,
    capacitor.isIos,
    cookieConsent === undefined ? "US" : cookieConsent.country
  );
  const handleClose = useCallback(() => onClose(), [onClose]);

  const menu = useMemo(() => {
    const navigationSections = showDropForge
      ? sections.map((section) =>
          section.key === "about" ? appendDropForgeToAbout(section) : section
        )
      : sections;
    const sectionMap = new Map(
      navigationSections.map((section) => [section.key, section])
    );

    return [
      sectionMap.get("nfts"),
      sectionMap.get("waves"),
      {
        label: "DMs",
        path: "/messages",
        icon: ChatBubbleIcon,
      },
      {
        label: "Join 6529",
        path: "/join",
        icon: UserPlusIcon,
      },
      sectionMap.get("about"),
    ].flatMap((item): SidebarMenu => {
      if (item === undefined) {
        return [];
      }

      if ("key" in item) {
        return [mapSectionToMenuItem(item)];
      }

      return [item];
    });
  }, [sections, showDropForge]);

  // Close on right-to-left swipe
  useEffect(() => {
    if (!open) return;
    let startX: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startX === null) return;
      const endX = e.changedTouches[0]?.clientX;
      if (endX !== undefined && startX - endX > 80) {
        handleClose();
      }
      startX = null;
    };

    const touchOptions: AddEventListenerOptions = { passive: true };
    globalThis.addEventListener("touchstart", onTouchStart, touchOptions);
    globalThis.addEventListener("touchend", onTouchEnd, touchOptions);
    return () => {
      globalThis.removeEventListener("touchstart", onTouchStart);
      globalThis.removeEventListener("touchend", onTouchEnd);
    };
  }, [open, handleClose]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1010] tw-overflow-hidden"
        onClose={handleClose}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-duration-300 tw-ease-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-200 tw-ease-in"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50" />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-flex">
          <TransitionChild
            as={Fragment}
            enter="tw-transform tw-duration-300 tw-ease-out"
            enterFrom="-tw-translate-x-full"
            enterTo="tw-translate-x-0"
            leave="tw-transform tw-duration-200 tw-ease-in"
            leaveFrom="tw-translate-x-0"
            leaveTo="-tw-translate-x-full"
          >
            <DialogPanel className="tw-pointer-events-auto tw-flex tw-size-full tw-max-w-[22.75rem] tw-flex-col tw-bg-iron-950 tw-pb-[env(safe-area-inset-bottom,0px)] tw-pt-[env(safe-area-inset-top,0px)] tw-shadow-xl">
              <AppSidebarHeader onClose={handleClose} />
              <nav
                aria-label="Primary navigation"
                className="tw-flex-1 tw-overflow-y-auto tw-py-6 tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
              >
                <div className="tw-flex tw-h-full tw-flex-col">
                  <div className="tw-flex-1 tw-px-2">
                    <AppSidebarMenuItems menu={menu} onNavigate={handleClose} />
                  </div>
                  <div className="tw-mt-auto tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-2 tw-pt-6">
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
