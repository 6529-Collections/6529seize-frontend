import React, { useEffect, useState } from "react";
import MyStream from "./MyStream";
import { useRouter } from "next/router";
import MyStreamWave from "./MyStreamWave";
import BrainContent from "../content/BrainContent";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../waves/detailed/WaveDetailedContent";
import { DropInteractionParams } from "../../waves/detailed/drops/WaveDetailedDrop";

const MyStreamWrapper: React.FC = () => {
  const router = useRouter();
  const [serialisedWaveId, setSerialisedWaveId] = useState<string | null>(null);

  useEffect(() => {
    const { wave: waveId } = router.query;
    setSerialisedWaveId(typeof waveId === "string" ? waveId : null);
  }, [router.query]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const getActiveWaveId = () => {
    return activeDrop?.drop.wave.id ?? serialisedWaveId;
  };

  const [activeWaveId, setActiveWaveId] = useState<string | null>(
    getActiveWaveId()
  );

  useEffect(() => {
    setActiveWaveId(getActiveWaveId());
  }, [activeDrop, serialisedWaveId]);

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

  const component = serialisedWaveId ? (
    <MyStreamWave
      waveId={serialisedWaveId}
      onReply={onReply}
      onQuote={onQuote}
      activeDrop={activeDrop}
    />
  ) : (
    <MyStream onReply={onReply} onQuote={onQuote} activeDrop={activeDrop} />
  );
  return (
    <BrainContent
      waveId={activeWaveId}
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
    >
      {component}
    </BrainContent>
  );
};

export default MyStreamWrapper;
