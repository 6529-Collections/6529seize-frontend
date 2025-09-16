"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
import PrimaryButton from "../utils/button/PrimaryButton";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CreateDirectMessageModal from "../waves/create-dm/CreateDirectMessageModal";
import { useAuth } from "../auth/Auth";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../types/dropInteractionTypes";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { DropInteractionParams } from "../waves/drops/Drop";

const MessagesView: React.FC = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { connectedProfile } = useAuth();
  const [serialisedWaveId, setSerialisedWaveId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const waveId = searchParams?.get('wave') || null;
    setSerialisedWaveId(waveId);
  }, [searchParams]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  const onDropContentClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('wave', drop.wave.id);
    params.set('serialNo', `${drop.serial_no}/`);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setActiveDrop(null);
  }, [serialisedWaveId]);

  const onReply = (param: DropInteractionParams) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop: param.drop,
      partId: param.partId,
    });
  };

  const onQuote = (param: DropInteractionParams) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop: param.drop,
      partId: param.partId,
    });
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  // For messages view, we show direct messages/DM waves
  // If a wave is selected, show the message thread
  // If no wave is selected, show a message to select a conversation
  const component = serialisedWaveId ? (
    <MyStreamWave key={`dm-wave-${serialisedWaveId}`} waveId={serialisedWaveId} />
  ) : (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-center tw-p-8">
      <h2 className="tw-text-xl tw-font-bold tw-text-iron-50 tw-mb-4">
        Select a Conversation
      </h2>
      <p className="tw-text-iron-400 tw-max-w-md tw-mb-6">
        Choose a direct message conversation from the sidebar to view messages and continue the discussion.
      </p>
      <PrimaryButton
        onClicked={() => setIsCreateModalOpen(true)}
        loading={false}
        disabled={false}
        padding="tw-px-4 tw-py-2"
      >
        <FontAwesomeIcon
          icon={faPaperPlane}
          className="tw-size-4 tw-flex-shrink-0 tw-mr-2"
        />
        <span>New Direct Message</span>
      </PrimaryButton>
    </div>
  );

  return (
    <>
      <BrainContent
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}>
        {component}
      </BrainContent>
      
      {/* Create Direct Message Modal */}
      {connectedProfile && (
        <CreateDirectMessageModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          profile={connectedProfile}
        />
      )}
    </>
  );
};

export default MessagesView;