"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
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
  const [serialisedWaveId, setSerialisedWaveId] = useState<string | null>(null);

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
      <p className="tw-text-iron-400 tw-max-w-md">
        Choose a direct message conversation from the sidebar to view messages and continue the discussion.
      </p>
    </div>
  );

  return (
    <BrainContent
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}>
      {component}
    </BrainContent>
  );
};

export default MessagesView;