import React from "react";
import { TabToggle } from "@/components/common/TabToggle";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ModalTab } from "./ArtistPreviewModal";

interface ArtistPreviewModalTabsProps {
  readonly activeTab: ModalTab;
  readonly onTabChange: (tab: ModalTab) => void;
  readonly panelId: string;
}

export const ArtistPreviewModalTabs: React.FC<ArtistPreviewModalTabsProps> = ({
  activeTab,
  onTabChange,
  panelId,
}) => {
  const locale = useBrowserLocale();

  return (
    <div className="tw-mt-4 tw-overflow-x-auto tw-px-6">
      <TabToggle
        options={[
          {
            key: "active",
            label: t(locale, "waves.artistPreview.activeSubmissions"),
            panelId,
          },
          {
            key: "winners",
            label: t(locale, "waves.artistPreview.mintedMemes"),
            panelId,
          },
        ]}
        activeKey={activeTab}
        onSelect={(key) => {
          if (key === "active" || key === "winners") {
            onTabChange(key);
          }
        }}
      />
    </div>
  );
};
