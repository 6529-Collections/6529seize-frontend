import React from "react";
import type { ModalTab } from "./ArtistPreviewModal";

interface ArtistPreviewModalTabsProps {
  readonly activeTab: ModalTab;
  readonly onTabChange: (tab: ModalTab) => void;
}

export const ArtistPreviewModalTabs: React.FC<ArtistPreviewModalTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="tw-relative tw-mt-4 tw-inline-flex tw-w-full tw-px-6 sm:tw-w-auto">
      <div className="tw-flex tw-h-9 tw-w-full tw-items-center tw-overflow-hidden tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-1 tw-text-xs tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:tw-w-auto">
        <button
          onClick={() => onTabChange("active")}
          className={`tw-flex-1 tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1.5 tw-transition tw-duration-300 ${
            activeTab === "active"
              ? "tw-bg-iron-800 tw-font-medium tw-text-iron-50 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_6px_rgba(0,0,0,0.15)]"
              : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-300"
          }`}
        >
          Active Submissions
        </button>

        <button
          onClick={() => onTabChange("winners")}
          className={`tw-flex-1 tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1.5 tw-transition-all tw-duration-300 ${
            activeTab === "winners"
              ? `tw-bg-[#3F3A31] tw-font-medium tw-text-[#EADFBF] tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_6px_rgba(0,0,0,0.2)]`
              : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-300"
          }`}
        >
          Minted to Memes
        </button>
      </div>
    </div>
  );
};
