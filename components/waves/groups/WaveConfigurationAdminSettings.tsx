"use client";

import { useAuth } from "@/components/auth/Auth";
import WaveApproveTabLabels from "@/components/waves/specs/WaveApproveTabLabels";
import WaveProposalCardSettings from "@/components/waves/specs/WaveProposalCardSettings";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { Suspense } from "react";
import WaveConfigurationCurations from "./WaveConfigurationCurations";
import WavePanelSection from "./WavePanelSection";

export default function WaveConfigurationAdminSettings({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const canConfigureWave = canEditWave({
    connectedProfile,
    activeProfileProxy,
    wave,
  });

  if (!canConfigureWave) {
    return null;
  }

  return (
    <>
      <WaveProposalCardSettings wave={wave} display="configuration" />

      {wave.wave.type === ApiWaveType.Approve && (
        <WavePanelSection
          title={waveRightPanelText(
            "waves.sidebar.rightPanel.settings.approvalTabs"
          )}
        >
          <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
            <WaveApproveTabLabels wave={wave} display="configuration" />
          </div>
        </WavePanelSection>
      )}

      <Suspense fallback={null}>
        <WaveConfigurationCurations wave={wave} />
      </Suspense>
    </>
  );
}
