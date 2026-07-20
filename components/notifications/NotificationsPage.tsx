"use client";

import { useState } from "react";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import Notifications from "../brain/notifications";
import type { ActiveDropState } from "../../types/dropInteractionTypes";
import BrainContent from "../brain/content/BrainContent";
import { useDropModal } from "@/hooks/useDropModal";
import BrainDesktopDrop from "@/components/brain/BrainDesktopDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import ConnectWallet from "@/components/common/ConnectWallet";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";

export default function NotificationsPage() {
  const { connectionState, hasValidWalletAuth } = useSeizeConnectContext();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const { activeDrop: modalDrop, isDropOpen, onDropClose } = useDropModal();
  const { isApp } = useDeviceInfo();
  const { notificationsViewStyle, spaces } = useLayout();

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  if (connectionState === "initializing" || connectionState === "connecting") {
    return (
      <div
        className="tailwind-scope tw-flex tw-items-center tw-justify-center tw-bg-black"
        style={notificationsViewStyle}
      >
        <output aria-label="Loading notifications" aria-live="polite">
          <CircleLoader size={CircleLoaderSize.LARGE} />
        </output>
      </div>
    );
  }

  if (!hasValidWalletAuth) {
    return <ConnectWallet />;
  }

  return (
    <div className="tailwind-scope tw-relative tw-h-full tw-overflow-hidden tw-bg-black">
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
