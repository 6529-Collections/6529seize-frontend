"use client";

import { useState } from "react";

import BrainDesktopDrop from "@/components/brain/BrainDesktopDrop";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import ConnectWallet from "@/components/common/ConnectWallet";
import { DropSize } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useDropModal } from "@/hooks/useDropModal";

import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import BrainContent from "../brain/content/BrainContent";
import Notifications from "../brain/notifications";

import type { ActiveDropState } from "../../types/dropInteractionTypes";

export default function NotificationsPage() {
  const { isAuthenticated } = useSeizeConnectContext();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const { activeDrop: modalDrop, isDropOpen, onDropClose } = useDropModal();
  const { isApp } = useDeviceInfo();
  const { spaces } = useLayout();

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  if (!isAuthenticated) {
    return <ConnectWallet />;
  }

  return (
    <div className="tw-h-full tw-bg-black tailwind-scope tw-relative tw-overflow-hidden">
      {isDropOpen &&
        modalDrop &&
        (isApp ? (
          <div
            className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-40"
            style={{ top: spaces.headerSpace }}
          >
            <BrainDesktopDrop
              drop={{
                type: DropSize.FULL,
                ...modalDrop,
                stableKey: modalDrop.id,
                stableHash: modalDrop.id,
              }}
              onClose={onDropClose}
            />
          </div>
        ) : (
          <div className="tw-absolute tw-inset-0 tw-z-[49]">
            <BrainDesktopDrop
              drop={{
                type: DropSize.FULL,
                ...modalDrop,
                stableKey: modalDrop.id,
                stableHash: modalDrop.id,
              }}
              onClose={onDropClose}
            />
          </div>
        ))}
      <div className="tw-h-full tw-px-2 lg:tw-px-6 xl:tw-px-8">
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
  );
}
