"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";
import { t } from "@/i18n/messages";
import type { ApiWave } from "@/generated/models/ApiWave";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { WaveDeleteFlowProvider } from "@/components/waves/header/options/delete/WaveDeleteFlowContext";
import { Mode, SidebarTab } from "../right-sidebar/BrainRightSidebarTypes";
import { WaveContent } from "../right-sidebar/WaveContent";
import { useWaveInformation } from "@/contexts/WaveInformationContext";
import {
  WaveInformationPanelContext,
  WAVE_NAME_EDIT_VIEW,
  WAVE_PICTURE_EDIT_VIEW,
  WAVE_OPTIONS_VIEW,
} from "./WaveInformationPanelContext";

export default function WaveInformationSheet({
  wave,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const isPhone = useMediaQuery(PHONE_WAVES_LAYOUT_QUERY);
  const information = useWaveInformation();
  const [tab, setTab] = useState(information?.request?.tab ?? SidebarTab.ABOUT);
  const [mode, setMode] = useState(Mode.CONTENT);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollTop = information?.request?.scrollTop ?? 0;
  const setScrollContainer = useCallback(
    (element: HTMLDivElement | null) => {
      scrollRef.current = element;
      if (element) element.scrollTop = initialScrollTop;
    },
    [initialScrollTop]
  );
  const subviewOpen = Boolean(
    information?.request && information.request.view !== "about"
  );
  const isCompactSubview =
    information?.request?.view === WAVE_NAME_EDIT_VIEW ||
    information?.request?.view === WAVE_PICTURE_EDIT_VIEW ||
    information?.request?.view === WAVE_OPTIONS_VIEW;
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
            prepareNavigation: (destination: string) =>
              information.prepareNavigation(
                destination,
                tab,
                scrollRef.current?.scrollTop ?? 0
              ),
          }
        : null,
    [information, contentId, container, tab]
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
      fixedHeight={!isCompactSubview}
      expandableHeight={
        isPhone &&
        !subviewOpen &&
        wave.chat.scope.group?.is_direct_message !== true
      }
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
              scrollRef={setScrollContainer}
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
