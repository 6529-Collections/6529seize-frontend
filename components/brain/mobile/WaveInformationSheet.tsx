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
import { waveNotificationSettingsMessage } from "@/components/waves/specs/wave-notification-settings/waveNotificationSettings.messages";
import { WaveInformationNotificationsContext } from "./WaveInformationNotificationsContext";

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
  const notificationsOpen = information?.request?.view === "notifications";
  const contentId = useId();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const notifications = useMemo(
    () =>
      information
        ? {
            isOpen: notificationsOpen,
            contentId,
            container,
            open: information.openNotifications,
            back: information.back,
          }
        : null,
    [information, notificationsOpen, contentId, container]
  );
  return (
    <MobileWrapperDialog
      isOpen
      title={
        notificationsOpen
          ? waveNotificationSettingsMessage(
              "waves.notificationSettings.trigger.tooltip"
            )
          : t(locale, "waves.information.open", { name: wave.name })
      }
      onClose={onClose}
      onBack={notificationsOpen ? information.back : undefined}
      onEscape={notificationsOpen ? information.back : undefined}
      focusTitleOnOpen={notificationsOpen}
      showHeaderDivider={false}
      tall
      fixedHeight={!notificationsOpen}
      noPadding
      headerClassName="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-py-4"
    >
      <WaveInformationNotificationsContext.Provider value={notifications}>
        <div hidden={notificationsOpen} className="tw-min-h-0 tw-flex-1">
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
          hidden={!notificationsOpen}
          className="tw-min-h-0 tw-flex-1 tw-py-4"
        />
      </WaveInformationNotificationsContext.Provider>
    </MobileWrapperDialog>
  );
}
