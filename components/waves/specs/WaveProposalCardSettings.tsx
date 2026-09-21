"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import ProposalCardLayoutPreview from "./wave-proposal-card-settings/ProposalCardLayoutPreview";
import WaveProposalCardSettingsEditor from "./wave-proposal-card-settings/WaveProposalCardSettingsEditor";
import { useWaveProposalCardSettings } from "./wave-proposal-card-settings/useWaveProposalCardSettings";
import WaveSettingRow from "./WaveSettingRow";

interface WaveProposalCardSettingsProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings" | undefined;
}

export default function WaveProposalCardSettings({
  wave,
  display = "settings",
}: WaveProposalCardSettingsProps) {
  const settings = useWaveProposalCardSettings(wave);
  const isConfiguration = display === "configuration";

  if (!settings.isSupported) {
    return null;
  }

  return (
    <WaveSettingRow
      canEdit={settings.canEdit}
      editIcon={isConfiguration ? "gear" : "pencil"}
      editLabel={settings.editLabel}
      label={settings.rowLabel}
      onOpen={settings.resetEditor}
      valueLabel={
        <span className="tw-inline-flex tw-max-w-full tw-items-center tw-gap-2">
          <ProposalCardLayoutPreview
            mode={settings.savedMode}
            className="tw-h-5 tw-w-[1.9375rem] tw-shrink-0 tw-text-iron-400"
          />
          <span className="tw-min-w-0">{settings.valueLabel}</span>
        </span>
      }
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
      variant={isConfiguration ? "content" : "row"}
    />
  );
}
