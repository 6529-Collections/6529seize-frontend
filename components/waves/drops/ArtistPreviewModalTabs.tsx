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
    <div className="tw-relative tw-z-[101] tw-mt-3 tw-px-6 after:tw-pointer-events-none after:tw-absolute after:tw-inset-x-0 after:tw-top-full after:tw-h-3 after:tw-bg-[#0E1012] after:tw-content-[''] max-sm:[&_[role=tab]]:tw-flex-1 max-sm:[&_[role=tab]]:tw-whitespace-normal max-sm:[&_[role=tablist]>div>div]:tw-min-w-0 max-sm:[&_[role=tablist]>div>div]:tw-flex-1 max-sm:[&_[role=tablist]>div]:tw-w-full">
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
