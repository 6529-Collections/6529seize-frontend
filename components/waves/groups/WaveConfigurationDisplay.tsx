"use client";

import { useAuth } from "@/components/auth/Auth";
import WaveOutcomesVisibility from "@/components/waves/specs/WaveOutcomesVisibility";
import WaveSubmissionButtonLabel from "@/components/waves/specs/WaveSubmissionButtonLabel";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import WavePanelSection from "./WavePanelSection";

interface WaveConfigurationDisplayProps {
  readonly wave: ApiWave;
}

export default function WaveConfigurationDisplay({
  wave,
}: WaveConfigurationDisplayProps) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const supportsDisplayConfiguration =
    wave.wave.type === ApiWaveType.Rank ||
    wave.wave.type === ApiWaveType.Approve;
  const canConfigureWave = canEditWave({
    connectedProfile,
    activeProfileProxy,
    wave,
  });

  if (!supportsDisplayConfiguration || !canConfigureWave) {
    return null;
  }

  return (
    <WavePanelSection
      title={waveRightPanelText("waves.sidebar.rightPanel.settings.display")}
    >
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
        <WaveSubmissionButtonLabel wave={wave} display="configuration" />
        <WaveOutcomesVisibility wave={wave} display="configuration" />
      </div>
    </WavePanelSection>
  );
}
