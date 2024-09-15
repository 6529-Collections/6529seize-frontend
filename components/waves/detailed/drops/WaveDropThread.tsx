import React, { useEffect, useRef, useState } from "react";
import CreateDrop from "../CreateDrop";

import { Wave } from "../../../../generated/models/Wave";

import { Drop } from "../../../../generated/models/Drop";
import WaveDrops from "./WaveDrops";
import { ActiveDropAction, ActiveDropState } from "../WaveDetailedContent";
import WaveDropThreadTrace from "./WaveDropThreadTrace";

interface WaveDropThreadProps {
  rootDropId: string;
  onBackToList: () => void;
  wave: Wave;
}

export default function WaveDropThread({
  rootDropId,
  onBackToList,
  wave,
}: WaveDropThreadProps) {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const createDropRef = useRef<HTMLDivElement>(null);
  const canDrop = wave.participation.authenticated_user_eligible;

  useEffect(() => {
    if (activeDrop && createDropRef.current) {
      const rect = createDropRef.current.getBoundingClientRect();
      const isFullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isFullyVisible) {
        const scrollTarget = window.scrollY + rect.top - 20; // 20px extra space
        window.scrollTo({
          top: scrollTarget,
          behavior: "smooth",
        });
      }
    }
  }, [activeDrop]);

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

  const onDropCreated = () => {
    setActiveDrop(null);
  };

  return (
    <div>
      <div className="tw-px-4 tw-pt-4">
        <button
          onClick={onBackToList}
          type="button"
          className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
        >
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 12H4M4 12L10 18M4 12L10 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span>Back</span>
        </button>
      </div>

      <WaveDropThreadTrace rootDropId={rootDropId} wave={wave} />

      <div className="tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800">
        {canDrop && (
          <div ref={createDropRef} className="tw-sticky tw-top-0 tw-z-10">
            <CreateDrop
              rootDropId={rootDropId}
              activeDrop={activeDrop}
              onCancelReplyQuote={onCancelReplyQuote}
              wave={{
                id: wave.id,
                name: wave.name,
                picture: wave.picture ?? "",
                description_drop_id: wave.description_drop.id,
                authenticated_user_eligible_to_participate:
                  wave.participation.authenticated_user_eligible,
                authenticated_user_eligible_to_vote:
                  wave.voting.authenticated_user_eligible,
              }}
              onDropCreated={onDropCreated}
            />
          </div>
        )}
        <WaveDrops
          wave={wave}
          onReply={handleReply}
          onQuote={handleQuote}
          activeDrop={activeDrop}
          rootDropId={rootDropId}
        />
      </div>
    </div>
  );
}
