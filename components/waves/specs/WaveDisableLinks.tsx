"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useCallback, useState } from "react";
import WaveDisableLinksEditorForm from "./WaveDisableLinksEditorForm";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";

interface WaveDisableLinksProps {
  readonly wave: ApiWave;
}

export default function WaveDisableLinks({ wave }: WaveDisableLinksProps) {
  const { canEdit, mutating, saveChatUpdate } = useWaveSettingUpdater(wave);
  const linksDisabled = wave.chat.links_disabled === true;
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
      editLabel="Edit disable links"
      label="Disable links"
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={linksDisabled ? "On" : "Off"}
    />
  );
}
