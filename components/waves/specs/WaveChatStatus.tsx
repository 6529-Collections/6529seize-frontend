"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useCallback, useState } from "react";
import WaveChatStatusEditorForm from "./WaveChatStatusEditorForm";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";

interface WaveChatStatusProps {
  readonly wave: ApiWave;
}

export default function WaveChatStatus({ wave }: WaveChatStatusProps) {
  const { canEdit, mutating, saveChatUpdate } = useWaveSettingUpdater(wave);
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

  return (
    <WaveSettingRow
      canEdit={canEdit && !isDirectMessage}
      editLabel={t(DEFAULT_LOCALE, "waves.chatSettings.status.editLabel")}
      label={t(DEFAULT_LOCALE, "waves.chatSettings.status.label")}
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={valueLabel}
    />
  );
}
