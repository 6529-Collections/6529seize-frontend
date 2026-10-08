"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { Suspense } from "react";
import WaveConfigurationCurations from "./WaveConfigurationCurations";

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
    <Suspense fallback={null}>
      <WaveConfigurationCurations wave={wave} />
    </Suspense>
  );
}
