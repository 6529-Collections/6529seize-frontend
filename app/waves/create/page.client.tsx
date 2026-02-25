"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/Auth";
import CreateWave from "@/components/waves/create-wave/CreateWave";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import { getWavesBaseRoute } from "@/helpers/navigation.helpers";


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
