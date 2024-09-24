import { useState, useEffect } from "react";
import { Wave } from "../../../generated/models/Wave";
import { Drop } from "../../../generated/models/Drop";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";

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
  readonly activeDropId: string | null;
  readonly wave: Wave;
  readonly onBackToList: () => void;
}

export default function WaveDetailedContent({
  activeDropId,
  wave,
  onBackToList,
}: WaveDetailedContentProps) {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const canDrop = wave.participation.authenticated_user_eligible;

  useEffect(() => {
    setIsThreadOpen(!!activeDropId);
  }, [activeDropId]);

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

  const closeActiveDropId = () => {
    onBackToList();
    setIsThreadOpen(false);
  };

  return (
    <div className="tw-w-full tw-flex tw-flex-col lg:tw-flex-row tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
      <div
        className={`tw-w-full tw-flex tw-flex-col ${
          isThreadOpen ? "tw-hidden lg:tw-flex" : ""
        }`}
      >
        <WaveDrops
          wave={wave}
          onReply={handleReply}
          onQuote={handleQuote}
          activeDrop={activeDrop}
          rootDropId={null}
        />
        {canDrop && (
          <div className="tw-mt-auto">
            <CreateDrop
              activeDrop={activeDrop}
              onCancelReplyQuote={onCancelReplyQuote}
              waveId={wave.id}
              rootDropId={null}
            />
          </div>
        )}
      </div>
      {isThreadOpen && (
        <div className="tw-w-full lg:tw-w-[75%]">
          <div className="tw-flex tw-flex-col lg:tw-hidden">
            <WaveDrops
              wave={wave}
              onReply={handleReply}
              onQuote={handleQuote}
              activeDrop={activeDrop}
              rootDropId={activeDropId}
              onBackToList={closeActiveDropId}
            />
            {canDrop && (
              <div className="tw-mt-auto">
                <CreateDrop
                  activeDrop={activeDrop}
                  onCancelReplyQuote={onCancelReplyQuote}
                  waveId={wave.id}
                  rootDropId={activeDropId}
                />
              </div>
            )}
          </div>
          <div className="tw-hidden lg:tw-flex tw-flex-col">
            <WaveDrops
              wave={wave}
              onReply={handleReply}
              onQuote={handleQuote}
              activeDrop={activeDrop}
              rootDropId={activeDropId}
              onBackToList={closeActiveDropId}
            />
            {canDrop && (
              <div className="tw-mt-auto">
                <CreateDrop
                  activeDrop={activeDrop}
                  onCancelReplyQuote={onCancelReplyQuote}
                  waveId={wave.id}
                  rootDropId={activeDropId}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
