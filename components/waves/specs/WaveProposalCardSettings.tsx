"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import WaveProposalCardSettingsEditor from "./wave-proposal-card-settings/WaveProposalCardSettingsEditor";
import { useWaveProposalCardSettings } from "./wave-proposal-card-settings/useWaveProposalCardSettings";
import WaveSettingRow from "./WaveSettingRow";

interface WaveProposalCardSettingsProps {
  readonly wave: ApiWave;
}

export default function WaveProposalCardSettings({
  wave,
}: WaveProposalCardSettingsProps) {
  const settings = useWaveProposalCardSettings(wave);

  if (!settings.isSupported) {
    return null;
  }

  return (
    <WaveSettingRow
      canEdit={settings.canEdit}
      editLabel={settings.editLabel}
      label={settings.rowLabel}
      onOpen={settings.resetEditor}
      valueLabel={settings.valueLabel}
      renderEditor={({ closeEditor }) => (
        <WaveProposalCardSettingsEditor
          closeEditor={closeEditor}
          draft={settings.draft}
          hasExcerptError={settings.hasExcerptError}
          isSaving={settings.isSaving}
          saveError={settings.saveError}
          submitDisabled={settings.submitDisabled}
          onDraftChange={settings.setDraft}
          onSubmit={() => settings.saveSettings(closeEditor)}
        />
      )}
    />
  );
}
