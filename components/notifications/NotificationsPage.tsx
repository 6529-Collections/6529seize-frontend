"use client";

import React, { useState } from "react";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import Image from "next/image";
import Notifications from "../brain/notifications/Notifications";
import { ActiveDropState } from "../../types/dropInteractionTypes";
import BrainContent from "../brain/content/BrainContent";
import { SidebarProvider } from "../../hooks/useSidebarState";
import { useDropModal } from "@/hooks/useDropModal";
import BrainDesktopDrop from "@/components/brain/BrainDesktopDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";

export default function NotificationsPage() {
  const { isAuthenticated } = useSeizeConnectContext();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const { drop, isDropOpen, onDropClose } = useDropModal();
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const { spaces } = useLayout();

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-px-6 tw-min-h-screen">
        <Image
          unoptimized
          priority
          loading="eager"
          src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
          alt="Brain"
          width={304}
          height={450}
          className="tw-rounded-md tw-shadow-lg tw-max-w-[30vw] md:tw-max-w-[200px] tw-h-auto"
        />
        <div className="tw-flex tw-flex-col tw-items-center md:tw-items-start tw-text-center md:tw-text-left tw-gap-4">
          <h1 className="tw-text-xl tw-font-bold">
            This content is only available to connected wallets.
          </h1>
          <p className="tw-text-base tw-text-gray-400">
            Connect your wallet to continue.
          </p>
          <HeaderUserConnect />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="tw-h-full tw-bg-black tailwind-scope tw-relative">
        {isDropOpen && drop && (
          isApp ? (
            <div
              className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-[1000]"
              style={{ top: spaces.headerSpace }}
            >
              <BrainDesktopDrop
                drop={{
                  type: DropSize.FULL,
                  ...drop,
                  stableKey: drop.id,
                  stableHash: drop.id,
                }}
                onClose={onDropClose}
              />
            </div>
          ) : (
            <div
              className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-[49] tw-bg-black"
              style={{
                left: hasTouchScreen ? 0 : "var(--left-rail)",
                top: spaces.headerSpace,
              }}
            >
              <BrainDesktopDrop
                drop={{
                  type: DropSize.FULL,
                  ...drop,
                  stableKey: drop.id,
                  stableHash: drop.id,
                }}
                onClose={onDropClose}
              />
            </div>
          )
        )}
        <div className="tw-h-full tw-px-2 lg:tw-px-8">
          <BrainContent
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
            showPinnedWaves={false}
          >
            <Notifications
              activeDrop={activeDrop}
              setActiveDrop={setActiveDrop}
            />
          </BrainContent>
        </div>
      </div>
    </SidebarProvider>
  );
}
