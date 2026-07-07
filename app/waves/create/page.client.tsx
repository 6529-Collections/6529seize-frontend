"use client";

import ConnectWallet from "@/components/common/ConnectWallet";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import CreateWave from "@/components/waves/create-wave/CreateWave";
import { useAuth } from "@/components/auth/Auth";
import { getWavesBaseRoute } from "@/helpers/navigation.helpers";
import { useRouter } from "next/navigation";
import type { CreateWaveConfig } from "@/types/waves.types";

export default function WavesCreatePageClient({
  initialConfig,
}: {
  readonly initialConfig?: CreateWaveConfig | undefined;
}) {
  const router = useRouter();
  const { connectedProfile } = useAuth();

  return (
    <WavesLayout>
      {connectedProfile ? (
        <CreateWave
          profile={connectedProfile}
          onBack={() => router.replace(getWavesBaseRoute(true))}
          initialConfig={initialConfig}
        />
      ) : (
        <ConnectWallet />
      )}
    </WavesLayout>
  );
}
