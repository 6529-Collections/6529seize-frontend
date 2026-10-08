"use client";

import { useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ApiWave } from "@/generated/models/ApiWave";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { WaveDeleteFlowProvider } from "@/components/waves/header/options/delete/WaveDeleteFlowContext";
import { Mode, SidebarTab } from "../right-sidebar/BrainRightSidebarTypes";
import { WaveContent } from "../right-sidebar/WaveContent";

export default function WaveInformationSheet({
  wave,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const [tab, setTab] = useState(SidebarTab.ABOUT);
  const [mode, setMode] = useState(Mode.CONTENT);
  return (
    <MobileWrapperDialog
      isOpen
      title={t(locale, "waves.information.open", { name: wave.name })}
      onClose={onClose}
      onBack={onClose}
      tall
      fixedHeight
      noPadding
    >
      <WaveDeleteFlowProvider>
        <WaveContent
          wave={wave}
          mode={mode}
          setMode={setMode}
          activeTab={tab}
          setActiveTab={setTab}
          maxVisibleTabs={3}
        />
      </WaveDeleteFlowProvider>
    </MobileWrapperDialog>
  );
}
