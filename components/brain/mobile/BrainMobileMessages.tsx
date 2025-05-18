import React from "react";
import BrainLeftSidebarDirectMessages from "../left-sidebar/direct-messages/BrainLeftSidebarDirectMessages";
import { useLayout } from "../my-stream/layout/LayoutContext";

const BrainMobileMessages: React.FC = () => {
  const { mobileWavesViewStyle } = useLayout();

  return (
    <div
      className="tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-space-y-4 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-pt-2"
      style={mobileWavesViewStyle}
    >
      <BrainLeftSidebarDirectMessages />
    </div>
  );
};

export default BrainMobileMessages; 