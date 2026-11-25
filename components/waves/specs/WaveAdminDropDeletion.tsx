"use client";

import { WaveInformationPanelContext } from "@/components/brain/mobile/WaveInformationPanelContext";
import WaveSettingSwitch from "./WaveSettingSwitch";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useCallback, useContext, useState } from "react";
import WaveAdminDropDeletionEditorForm from "./WaveAdminDropDeletionEditorForm";
import WaveSettingRow from "./WaveSettingRow";
import { useWaveSettingUpdater } from "./useWaveSettingUpdater";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

interface WaveAdminDropDeletionProps {
  readonly wave: ApiWave;
}

/** Lets wave admins turn admin post deletion on or off after creation. */
export default function WaveAdminDropDeletion({
  wave,
}: WaveAdminDropDeletionProps) {
  const phoneDetails =
    useContext(WaveInformationPanelContext)?.isPhone === true;
  const { canEdit, mutating, saveAdminDropDeletion } =
    useWaveSettingUpdater(wave);
  const enabled = wave.wave.admin_drop_deletion_enabled === true;
  const [draftEnabled, setDraftEnabled] = useState(enabled);

  const resetEditor = useCallback(() => {
    setDraftEnabled(enabled);
  }, [enabled]);

  const renderEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => (
    <WaveAdminDropDeletionEditorForm
      checked={draftEnabled}
      disabled={mutating}
      onCancel={closeEditor}
      onCheckedChange={setDraftEnabled}
      onSave={() => saveAdminDropDeletion(closeEditor, draftEnabled)}
    />
  );

  if (phoneDetails)
    return (
      <WaveSettingSwitch
        label={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.adminDropDeletion.label"
        )}
        checked={enabled}
        disabled={mutating || !canEdit}
        onChange={(next) => saveAdminDropDeletion(() => {}, next)}
      />
    );

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editIcon="gear"
      editLabel={waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.adminDropDeletion.edit"
      )}
      label={waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.adminDropDeletion.label"
      )}
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={waveRightPanelText(
        enabled
          ? "waves.sidebar.rightPanel.configuration.adminDropDeletion.on"
          : "waves.sidebar.rightPanel.configuration.adminDropDeletion.off"
      )}
    />
  );
}
