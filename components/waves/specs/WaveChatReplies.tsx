"use client";

import { WaveInformationPanelContext } from "@/components/brain/mobile/WaveInformationPanelContext";
import WaveSettingSwitch from "./WaveSettingSwitch";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getWaveChatRepliesSettings,
  getWaveChatRepliesValueLabel,
  type WaveChatRepliesSettings,
} from "@/helpers/waves/wave-chat-replies.helpers";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { useCallback, useContext, useState } from "react";
import WaveChatRepliesEditorForm from "./WaveChatRepliesEditorForm";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";

interface WaveChatRepliesProps {
  readonly wave: ApiWave;
}

export default function WaveChatReplies({ wave }: WaveChatRepliesProps) {
  const phoneDetails =
    useContext(WaveInformationPanelContext)?.isPhone === true;
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

  if (phoneDetails)
    return (
      <>
        <WaveSettingSwitch
          label={waveRightPanelText(
            "waves.sidebar.rightPanel.configuration.chat.replies.openLabel"
          )}
          checked={open}
          disabled={mutating || !canEdit}
          onChange={(next) =>
            saveChatUpdate(
              () => {},
              (chat) => ({ ...chat, replies: { open: next, collapsed } })
            )
          }
        />
        <WaveSettingSwitch
          label={waveRightPanelText(
            "waves.sidebar.rightPanel.configuration.chat.replies.collapsedLabel"
          )}
          checked={collapsed}
          disabled={mutating || !canEdit}
          onChange={(next) =>
            saveChatUpdate(
              () => {},
              (chat) => ({ ...chat, replies: { open, collapsed: next } })
            )
          }
        />
      </>
    );

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
