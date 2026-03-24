"use client";

import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
import { useAuth } from "../auth/Auth";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import PrimaryButton from "../utils/button/PrimaryButton";
import useCreateModalState from "@/hooks/useCreateModalState";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import WaveScreenMessage from "./WaveScreenMessage";

const WavesView: React.FC = () => {
  const myStream = useMyStreamOptional();
  const { connectedProfile } = useAuth();
  const { isApp } = useDeviceInfo();
  const { openWave } = useCreateModalState();

  const serialisedWaveId = myStream?.activeWave.id ?? null;

  const showPlaceholder = !serialisedWaveId && !isApp;

  let content: React.ReactNode = null;

  if (serialisedWaveId) {
    content = (
      <MyStreamWave
        key={`wave-${serialisedWaveId}`}
        waveId={serialisedWaveId}
      />
    );
  } else if (showPlaceholder) {
    content = (
      <WaveScreenMessage
        title="Select a Wave"
        description="Choose a wave to view its content and participate in the discussion."
        action={
          connectedProfile ? (
            <PrimaryButton
              onClicked={openWave}
              disabled={false}
              loading={false}
            >
              <PlusIcon className="-tw-ml-1 tw-h-5 tw-w-5" />
              Create Wave
            </PrimaryButton>
          ) : null
        }
      />
    );
  }

  // Note: Wave views (MyStreamWave) manage their own activeDrop state
  // internally via MyStreamWaveChat. We pass null to BrainContent because
  // the wave's internal state controls the reply/quote input box.
  return (
    <BrainContent activeDrop={null} onCancelReplyQuote={() => {}}>
      {content}
    </BrainContent>
  );
};

export default React.memo(WavesView);
