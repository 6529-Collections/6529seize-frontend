"use client";

import { useId, useMemo, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ApiWave } from "@/generated/models/ApiWave";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { WaveDeleteFlowProvider } from "@/components/waves/header/options/delete/WaveDeleteFlowContext";
import { Mode, SidebarTab } from "../right-sidebar/BrainRightSidebarTypes";
import { WaveContent } from "../right-sidebar/WaveContent";
import { useWaveInformation } from "@/contexts/WaveInformationContext";
import { WaveInformationPanelContext } from "./WaveInformationPanelContext";

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
  const information = useWaveInformation();
  const subviewOpen = Boolean(
    information?.request && information.request.view !== "about"
  );
  const contentId = useId();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const panel = useMemo(
    () =>
      information
        ? {
            view: information.request?.view ?? "about",
            contentId,
            container,
            open: information.openSubview,
            back: information.back,
          }
        : null,
    [information, contentId, container]
  );
  return (
    <MobileWrapperDialog
      isOpen
      title={
        subviewOpen && information?.request?.viewTitle
          ? information.request.viewTitle
          : t(locale, "waves.information.open", { name: wave.name })
      }
      onClose={onClose}
      onBack={subviewOpen ? information?.back : undefined}
      onEscape={subviewOpen ? information?.back : undefined}
      focusTitleOnOpen={subviewOpen}
      showHeaderDivider={false}
      tall
      fixedHeight={!subviewOpen}
      fitVisualViewport
      noPadding
      headerClassName="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-py-4"
    >
      <WaveInformationPanelContext.Provider value={panel}>
        <div hidden={subviewOpen} className="tw-min-h-0 tw-flex-1">
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
        </div>
        <div
          id={contentId}
          ref={setContainer}
          hidden={!subviewOpen}
          className="tw-min-h-0 tw-flex-1 tw-py-4"
        />
      </WaveInformationPanelContext.Provider>
    </MobileWrapperDialog>
  );
}
