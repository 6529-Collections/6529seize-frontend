"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
import PrimaryButton from "../utils/button/PrimaryButton";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CreateDirectMessageModal from "../waves/create-dm/CreateDirectMessageModal";
import { useAuth } from "../auth/Auth";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import useCreateModalState from "@/hooks/useCreateModalState";

const MessagesView: React.FC = () => {
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const { isApp } = useDeviceInfo();
  const { isDirectMessageModalOpen, openDirectMessage, close } =
    useCreateModalState();

  const serialisedWaveId = searchParams?.get("wave") || null;

  const showPlaceholder = !serialisedWaveId && !isApp;

  let content: React.ReactNode = null;

  if (serialisedWaveId) {
    content = (
      <MyStreamWave
        key={`dm-wave-${serialisedWaveId}`}
        waveId={serialisedWaveId}
      />
    );
  } else if (showPlaceholder) {
    content = (
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-center tw-p-8">
        <h2 className="tw-text-xl tw-font-bold tw-text-iron-50 tw-mb-4">
          Select a Conversation
        </h2>
        <p className="tw-text-iron-400 tw-max-w-md tw-mb-6">
          Choose a direct message conversation from the sidebar to view
          messages and continue the discussion.
        </p>
        <PrimaryButton
          onClicked={openDirectMessage}
          loading={false}
          disabled={false}
        >
          <FontAwesomeIcon
            icon={faPaperPlane}
            className="tw-size-4 tw-flex-shrink-0 tw-mr-2"
          />
          <span>Create DM</span>
        </PrimaryButton>
      </div>
    );
  }

  return (
    <>
      <BrainContent activeDrop={null} onCancelReplyQuote={() => {}}>
        {content}
      </BrainContent>

      {connectedProfile && (
        <CreateDirectMessageModal
          isOpen={isDirectMessageModalOpen}
          onClose={close}
          profile={connectedProfile}
        />
      )}
    </>
  );
};

export default React.memo(MessagesView);
