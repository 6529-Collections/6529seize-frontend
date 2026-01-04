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
    <div className="tw-px-6 tw-mt-4 tw-inline-flex tw-relative tw-w-full sm:tw-w-auto">
      <div
        className="
    tw-flex tw-items-center tw-h-9 tw-px-1 tw-text-xs tw-whitespace-nowrap
    tw-rounded-lg tw-overflow-hidden tw-bg-iron-950 tw-border tw-border-iron-800 tw-border-solid
    tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] tw-w-full sm:tw-w-auto
  "
      >
        <button
          onClick={() => onTabChange("active")}
          className={`tw-px-2.5 tw-py-1.5 tw-border-0 tw-rounded-md tw-transition tw-duration-300 tw-flex-1 ${
            activeTab === "active"
              ? "tw-bg-iron-800 tw-text-iron-50 tw-font-medium tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_6px_rgba(0,0,0,0.15)]"
              : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent"
          }`}
        >
          Active Submissions
        </button>

        <button
          onClick={() => onTabChange("winners")}
          className={`tw-px-2.5 tw-py-1.5 tw-border-0 tw-rounded-md tw-transition-all tw-duration-300 tw-flex-1 ${
            activeTab === "winners"
              ? `
                tw-bg-[#3F3A31]
                tw-text-[#EADFBF]
                tw-font-medium
               tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_6px_rgba(0,0,0,0.2)]
              `
              : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent"
          }`}
        >
          Winning Artworks
        </button>
      </div>
    </div>
  );
};
