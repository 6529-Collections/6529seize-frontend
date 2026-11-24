"use client";

import { WaveInformationPanelContext } from "@/components/brain/mobile/WaveInformationPanelContext";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import WaveSettingSwitch from "./WaveSettingSwitch";
import type { ApiWave } from "@/generated/models/ApiWave";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useCallback, useContext, useState } from "react";
import WaveChatStatusEditorForm from "./WaveChatStatusEditorForm";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";

interface WaveChatStatusProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings" | undefined;
}

export default function WaveChatStatus({
  wave,
  display = "settings",
}: WaveChatStatusProps) {
  const phoneDetails =
    useContext(WaveInformationPanelContext)?.isPhone === true;
  const { canEdit, mutating, saveChatUpdate } = useWaveSettingUpdater(wave);
  const [confirmOff, setConfirmOff] = useState(false);
  const chatEnabled = wave.chat.enabled === true;
  const isDirectMessage = wave.chat.scope.group?.is_direct_message === true;
  const [draftChatEnabled, setDraftChatEnabled] = useState(chatEnabled);
  const valueLabel = t(
    DEFAULT_LOCALE,
    chatEnabled
      ? "waves.chatSettings.status.enabled"
      : "waves.chatSettings.status.disabled"
  );

  const resetEditor = useCallback(() => {
    setDraftChatEnabled(chatEnabled);
  }, [chatEnabled]);

  const handleSave = (closeEditor: () => void) => {
    saveChatUpdate(closeEditor, (chat) => ({
      ...chat,
      enabled: draftChatEnabled,
    }));
  };

  const renderEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => (
    <WaveChatStatusEditorForm
      checked={draftChatEnabled}
      disabled={mutating}
      onCancel={closeEditor}
      onCheckedChange={setDraftChatEnabled}
      onSave={() => handleSave(closeEditor)}
    />
  );

  if (phoneDetails && display === "configuration") {
    const save = (enabled: boolean) =>
      saveChatUpdate(
        () => setConfirmOff(false),
        (chat) => ({ ...chat, enabled })
      );
    return (
      <>
        <WaveSettingSwitch
          label={t(DEFAULT_LOCALE, "waves.chatSettings.status.label")}
          checked={chatEnabled}
          disabled={mutating || !canEdit || isDirectMessage}
          onChange={(enabled) => {
            if (enabled) save(true);
            else setConfirmOff(true);
          }}
        />
        <MobileWrapperConfirmationDialog
          isOpen={confirmOff}
          onClose={() => setConfirmOff(false)}
          onConfirm={() => save(false)}
          title={t(DEFAULT_LOCALE, "waves.information.turnOffChat")}
          message={t(DEFAULT_LOCALE, "waves.information.turnOffChatMessage")}
          confirmText={t(DEFAULT_LOCALE, "waves.information.turnOffChatAction")}
          confirmVariant="destructive"
          isConfirming={mutating}
          zIndexClassName="tw-z-[11000]"
        />
      </>
    );
  }

  return (
    <WaveSettingRow
      canEdit={canEdit && !isDirectMessage}
      editIcon={display === "configuration" ? "gear" : "pencil"}
      editLabel={t(DEFAULT_LOCALE, "waves.chatSettings.status.editLabel")}
      label={t(DEFAULT_LOCALE, "waves.chatSettings.status.label")}
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={valueLabel}
    />
  );
}
