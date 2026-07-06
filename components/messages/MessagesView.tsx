"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
import PrimaryButton from "../utils/button/PrimaryButton";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import useCreateModalState from "@/hooks/useCreateModalState";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";

const MessagesView: React.FC = () => {
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense covered by app/messages page Suspense wrapper
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const { openDirectMessage } = useCreateModalState();

  const serialisedWaveId = getActiveWaveIdFromUrl({ pathname, searchParams });

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
      <div className="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center tw-p-8 tw-text-center">
        <h2 className="tw-mb-4 tw-text-xl tw-font-bold tw-text-iron-50">
          Select a Conversation
        </h2>
        <p className="tw-mb-6 tw-max-w-md tw-text-iron-400">
          Choose a direct message conversation from the sidebar to view messages
          and continue the discussion.
        </p>
        <PrimaryButton
          onClicked={openDirectMessage}
          loading={false}
          disabled={false}
        >
          <FontAwesomeIcon
            icon={faPaperPlane}
            className="tw-mr-2 tw-size-4 tw-flex-shrink-0"
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
    </>
  );
};

export default React.memo(MessagesView);
