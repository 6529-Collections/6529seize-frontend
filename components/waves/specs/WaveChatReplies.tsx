"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getWaveChatRepliesSettings,
  getWaveChatRepliesValueLabel,
  type WaveChatRepliesSettings,
} from "@/helpers/waves/wave-chat-replies.helpers";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { useCallback, useState } from "react";
import WaveChatRepliesEditorForm from "./WaveChatRepliesEditorForm";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";

interface WaveChatRepliesProps {
  readonly wave: ApiWave;
}

export default function WaveChatReplies({ wave }: WaveChatRepliesProps) {
  const { canEdit, mutating, saveChatUpdate } = useWaveSettingUpdater(wave);
  const { open, collapsed } = getWaveChatRepliesSettings(wave.chat);
  const [draft, setDraft] = useState<WaveChatRepliesSettings>({
    open,
    collapsed,
  });

  const resetEditor = useCallback(() => {
    setDraft({ open, collapsed });
  }, [open, collapsed]);

  const handleSave = (closeEditor: () => void) => {
    saveChatUpdate(closeEditor, (chat) => ({
      ...chat,
      replies: { open: draft.open, collapsed: draft.collapsed },
    }));
  };

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editIcon="gear"
      editLabel={waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.chat.replies.edit"
      )}
      label={waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.chat.replies.label"
      )}
      onOpen={resetEditor}
      renderEditor={({ closeEditor }) => (
        <WaveChatRepliesEditorForm
          settings={draft}
          disabled={mutating}
          onCancel={closeEditor}
          onSettingsChange={setDraft}
          onSave={() => handleSave(closeEditor)}
        />
      )}
      valueLabel={getWaveChatRepliesValueLabel({ open, collapsed })}
    />
  );
}
