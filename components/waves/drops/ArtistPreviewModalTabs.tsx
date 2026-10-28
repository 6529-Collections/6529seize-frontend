import React from "react";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
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
    <div className="tw-mt-4 tw-px-6">
      <CommonTabs<ModalTab>
        items={[
          {
            key: "active",
            value: "active",
            label: t(locale, "waves.artistPreview.activeSubmissions"),
            panelId,
          },
          {
            key: "winners",
            value: "winners",
            label: t(locale, "waves.artistPreview.mintedMemes"),
            panelId,
          },
        ]}
        activeItem={activeTab}
        setSelected={onTabChange}
        filterLabel={t(locale, "waves.artistPreview.submissionCategories")}
        size="sm"
        fill={false}
      />
    </div>
  );
};
