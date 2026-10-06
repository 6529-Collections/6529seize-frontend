"use client";

import AuthLoadingPlaceholder from "@/components/auth/AuthLoadingPlaceholder";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isAuthResolving } from "@/components/auth/authResolution";
import ConnectWallet from "@/components/common/ConnectWallet";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import CreateWave from "@/components/waves/create-wave/CreateWave";
import CreateWaveProfileRequiredModal from "@/components/waves/create-wave/CreateWaveProfileRequiredModal";
import { useAuth } from "@/components/auth/Auth";
import { getWavesBaseRoute } from "@/helpers/navigation.helpers";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function WavesCreatePageClient() {
  const router = useRouter();
  const locale = useBrowserLocale();
  const { connectedProfile, fetchingProfile } = useAuth();
  const { connectionState } = useSeizeConnectContext();
  const closeCreate = () => router.replace(getWavesBaseRoute(true));
  let content: ReactNode;

  if (isAuthResolving(connectionState, fetchingProfile)) {
    content = <AuthLoadingPlaceholder />;
  } else if (!connectedProfile) {
    content = (
      <ConnectWallet
        title={t(locale, "waves.create.quick.connectTitle")}
        description={t(locale, "waves.create.quick.connectDescription")}
      />
    );
  } else if (!connectedProfile.handle?.trim()) {
    content = (
      <CreateWaveProfileRequiredModal
        isOpen
        onClose={closeCreate}
        profile={connectedProfile}
      />
    );
  } else {
    content = (
      <CreateWave
        key={`${connectedProfile.primary_wallet}:${connectedProfile.id ?? ""}`}
        profile={connectedProfile}
        onBack={closeCreate}
      />
    );
  }

  return <WavesLayout>{content}</WavesLayout>;
}
