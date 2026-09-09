"use client";

import ConnectWallet from "@/components/common/ConnectWallet";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import CreateWave from "@/components/waves/create-wave/CreateWave";
import CreateWaveProfileRequiredModal from "@/components/waves/create-wave/CreateWaveProfileRequiredModal";
import { useAuth } from "@/components/auth/Auth";
import { getWavesBaseRoute } from "@/helpers/navigation.helpers";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function WavesCreatePageClient() {
  const router = useRouter();
  const { connectedProfile } = useAuth();
  const closeCreate = () => router.replace(getWavesBaseRoute(true));
  let content: ReactNode;

  if (!connectedProfile) {
    content = <ConnectWallet />;
  } else if (!connectedProfile.handle?.trim()) {
    content = (
      <CreateWaveProfileRequiredModal
        isOpen
        onClose={closeCreate}
        profile={connectedProfile}
      />
    );
  } else {
    content = <CreateWave profile={connectedProfile} onBack={closeCreate} />;
  }

  return <WavesLayout>{content}</WavesLayout>;
}
