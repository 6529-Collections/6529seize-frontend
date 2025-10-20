"use client";

import WavesLayout from "@/components/waves/layout/WavesLayout";
import CreateWave from "@/components/waves/create-wave/CreateWave";
import { useAuth } from "@/components/auth/Auth";
import { getWavesBaseRoute } from "@/helpers/navigation.helpers";
import { useRouter } from "next/navigation";

export default function WavesCreatePageClient() {
  const router = useRouter();
  const { connectedProfile } = useAuth();

  return (
    <WavesLayout>
      {connectedProfile ? (
        <CreateWave
          profile={connectedProfile}
          onBack={() => router.replace(getWavesBaseRoute(true))}
        />
      ) : null}
    </WavesLayout>
  );
}
