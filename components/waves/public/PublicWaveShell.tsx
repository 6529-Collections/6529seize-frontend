"use client";

import SpinnerLoader from "@/components/common/SpinnerLoader";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import WaveScreenMessage from "../WaveScreenMessage";
import { usePublicWaveShellState } from "./usePublicWaveShellState";

interface PublicWaveShellProps {
  readonly waveId: string;
}

function PublicWaveLoadingState() {
  return (
    <div className="tw-flex tw-min-h-full tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-py-8">
      <SpinnerLoader text="Loading wave..." />
    </div>
  );
}

function PublicWaveUnavailableState() {
  return (
    <WaveScreenMessage
      title="This wave isn't available publicly"
      description="Connect your wallet to check whether you have access."
      action={<HeaderUserConnect label="Connect Wallet" />}
    />
  );
}

function PublicWaveShellContent({ waveId }: { readonly waveId: string }) {
  return (
    <div className="tw-flex tw-h-full tw-min-h-0 tw-flex-1 tw-flex-col">
      <MyStreamWave waveId={waveId} />
    </div>
  );
}

export default function PublicWaveShell({ waveId }: PublicWaveShellProps) {
  const shellState = usePublicWaveShellState(waveId);

  switch (shellState.status) {
    case "loading":
      return <PublicWaveLoadingState />;
    case "unavailable":
      return <PublicWaveUnavailableState />;
    case "ready":
      return <PublicWaveShellContent waveId={waveId} />;
  }
}
