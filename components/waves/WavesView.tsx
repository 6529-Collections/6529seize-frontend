"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
import CreateWaveModal from "./create-wave/CreateWaveModal";
import { useAuth } from "../auth/Auth";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import PrimaryButton from "../utils/button/PrimaryButton";
import useCreateModalState from "@/hooks/useCreateModalState";

const WavesView: React.FC = () => {
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const { isApp } = useDeviceInfo();
  const { isWaveModalOpen, openWave, close } = useCreateModalState();

  const serialisedWaveId = searchParams?.get('wave') || null;

  const showPlaceholder = !serialisedWaveId && !isApp;

  let content: React.ReactNode = null;

  if (serialisedWaveId) {
    content = (
      <MyStreamWave key={`wave-${serialisedWaveId}`} waveId={serialisedWaveId} />
    );
  } else if (showPlaceholder) {
    content = (
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-center tw-p-8">
        <h2 className="tw-text-xl tw-font-bold tw-text-iron-50 tw-mb-4">
          Select a Wave
        </h2>
        <p className="tw-text-iron-400 tw-max-w-md tw-mb-6 tw-text-sm sm:tw-text-base">
          Choose a wave to view its content and participate in the discussion.
        </p>

        {connectedProfile && (
          <PrimaryButton
            onClicked={openWave}
            disabled={false}
            loading={false}
          >
            <PlusIcon className="tw-w-5 tw-h-5 -tw-ml-1" />
            Create Wave
          </PrimaryButton>
        )}
      </div>
    );
  }

  // Note: Wave views (MyStreamWave) manage their own activeDrop state
  // internally via MyStreamWaveChat. We pass null to BrainContent because
  // the wave's internal state controls the reply/quote input box.
  return (
    <>
      <BrainContent
        activeDrop={null}
        onCancelReplyQuote={() => {}}>
        {content}
      </BrainContent>

      {/* Create Wave Modal */}
      {connectedProfile && (
        <CreateWaveModal
          isOpen={isWaveModalOpen}
          onClose={close}
          profile={connectedProfile}
        />
      )}
    </>
  );
};

export default React.memo(WavesView);
