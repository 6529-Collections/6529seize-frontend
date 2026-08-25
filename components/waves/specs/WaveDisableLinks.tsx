"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useCallback, useState } from "react";
import WaveDisableLinksEditorForm from "./WaveDisableLinksEditorForm";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

interface WaveDisableLinksProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings" | undefined;
}

export default function WaveDisableLinks({
  wave,
  display = "settings",
}: WaveDisableLinksProps) {
  const { canEdit, mutating, saveChatUpdate } = useWaveSettingUpdater(wave);
  const linksDisabled = wave.chat.links_disabled === true;
  let valueLabel = linksDisabled ? "On" : "Off";
  if (display === "configuration") {
    valueLabel = waveRightPanelText(
      linksDisabled
        ? "waves.sidebar.rightPanel.configuration.chat.links.disabled"
        : "waves.sidebar.rightPanel.configuration.chat.links.allowed"
    );
  }
  const [draftLinksDisabled, setDraftLinksDisabled] = useState(linksDisabled);

  const resetEditor = useCallback(() => {
    setDraftLinksDisabled(linksDisabled);
  }, [linksDisabled]);

  const handleSave = (closeEditor: () => void) => {
    saveChatUpdate(closeEditor, (chat) => ({
      ...chat,
      links_disabled: draftLinksDisabled,
    }));
  };

  const renderEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => (
    <WaveDisableLinksEditorForm
      checked={draftLinksDisabled}
      disabled={mutating}
      onCancel={closeEditor}
      onCheckedChange={setDraftLinksDisabled}
      onSave={() => handleSave(closeEditor)}
    />
  );

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editIcon={display === "configuration" ? "gear" : "pencil"}
      editLabel={
        display === "configuration"
          ? waveRightPanelText(
              "waves.sidebar.rightPanel.configuration.chat.links.edit"
            )
          : "Edit disable links"
      }
      label={
        display === "configuration"
          ? waveRightPanelText(
              "waves.sidebar.rightPanel.configuration.chat.links.label"
            )
          : "Disable links"
      }
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={valueLabel}
    />
  );
}
