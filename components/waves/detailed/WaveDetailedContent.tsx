import { useState } from "react";
import { Wave } from "../../../generated/models/Wave";
import { Drop } from "../../../generated/models/Drop";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";
import { useSearchParams } from "next/navigation";

export enum ActiveDropAction {
  REPLY = "REPLY",
  QUOTE = "QUOTE",
}

export interface ActiveDropState {
  action: ActiveDropAction;
  drop: Drop;
  partId: number;
}

interface WaveDetailedContentProps {
  readonly wave: Wave;
}

export default function WaveDetailedContent({
  wave,
}: WaveDetailedContentProps) {
  const searchParams = useSearchParams();
  const initialDrop = searchParams.get("drop");
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
    <div className="tw-relative tw-h-full">
      <div className="tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
        <div className="tw-w-full tw-flex tw-flex-col">
          <WaveDrops
            wave={wave}
            onReply={handleReply}
            onQuote={handleQuote}
            activeDrop={activeDrop}
            initialDrop={initialDrop ? parseInt(initialDrop) : null}
          />
          {canDrop && (
            <div className="tw-mt-auto">
              <CreateDrop
                activeDrop={activeDrop}
                onCancelReplyQuote={onCancelReplyQuote}
                wave={wave}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
