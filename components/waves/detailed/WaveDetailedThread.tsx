import { Drop } from "../../../generated/models/Drop";
import { Wave } from "../../../generated/models/Wave";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";

import React, { useEffect, useState } from "react";
import { ActiveDropAction, ActiveDropState } from "./WaveDetailedContent";

export const WaveDetailedThread: React.FC<{
  readonly wave: Wave;
  readonly rootDropId: string | null;
  readonly closeActiveDropId: () => void;
}> = ({
  wave,
  rootDropId,
  closeActiveDropId,
}) => {

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const canDrop = wave.participation.authenticated_user_eligible;


  const onReply = (drop: Drop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop,
      partId,
    });
  };

  const onQuote = (drop: Drop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop,
      partId,
    });
  };

  const handleReply = ({ drop, partId }: { drop: Drop; partId: number }) => {
    onReply(drop, partId);
  };

  const handleQuote = ({ drop, partId }: { drop: Drop; partId: number }) => {
    onQuote(drop, partId);
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  return (
    <div className="tw-flex tw-flex-col">
      <WaveDrops
        wave={wave}
        onReply={handleReply}
        onQuote={handleQuote}
        activeDrop={activeDrop}
        rootDropId={rootDropId}
        onBackToList={closeActiveDropId}
      />
      {canDrop && (
        <div className="tw-mt-auto">
          <CreateDrop
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
            waveId={wave.id}
            rootDropId={rootDropId}
          />
        </div>
      )}
    </div>
  );
};

export default WaveDetailedThread;
