import { ActiveDropState } from "./WaveDetailedContent";
import { useState } from "react";
import { CreateDropConfig } from "../../../entities/IDrop";

import CreateDropStormParts from "./CreateDropStormParts";
import { WaveMin } from "../../../generated/models/WaveMin";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropContent from "./CreateDropContent";
import { useQuery } from "@tanstack/react-query";
import { Wave } from "../../../generated/models/Wave";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";

interface CreateDropProps {
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly onCancelReplyQuote: () => void;
  readonly waveId: string;
  readonly onDropCreated: () => void;
}

export default function CreateDrop({
  activeDrop,
  rootDropId,
  onCancelReplyQuote,
  waveId,
  onDropCreated,
}: CreateDropProps) {
  const [isStormMode, setIsStormMode] = useState(false);
  const [drop, setDrop] = useState<CreateDropConfig | null>(null);

  const onRemovePart = (partIndex: number) => {
    setDrop((prevDrop) => {
      if (!prevDrop) return null;
      const newParts = prevDrop.parts.filter((_, i) => i !== partIndex);
      return {
        ...prevDrop,
        parts: newParts,
        referenced_nfts: prevDrop.referenced_nfts || [],
        mentioned_users: prevDrop.mentioned_users || [],
        metadata: prevDrop.metadata || [],
      };
    });
  };

  const { data: wave, isFetching, isError, error } = useQuery<Wave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () =>
      await commonApiFetch<Wave>({
        endpoint: `waves/${waveId}`,
      }),
  });

  return (
    <div className="tw-py-4 tw-px-4 tw-top-0 tw-sticky tw-z-10 tw-w-full tw-rounded-t-xl tw-backdrop-blur tw-flex-none tw-transition-colors tw-duration-500 tw-lg:z-50 lg:tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0 tw-border-iron-50/[0.06] tw-supports-backdrop-blur:tw-bg-white/95 tw-bg-iron-950/80">
      <AnimatePresence>
        {isStormMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CreateDropStormParts
              parts={drop?.parts ?? []}
              mentionedUsers={drop?.mentioned_users ?? []}
              referencedNfts={drop?.referenced_nfts ?? []}
              onRemovePart={onRemovePart}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {isFetching ? (
        <div className="tw-animate-pulse tw-flex tw-items-center tw-space-x-4">
          <div className="tw-h-[45px] tw-flex-grow tw-bg-iron-800 tw-rounded-lg"></div>
          <div className="tw-h-[45px] tw-w-[100px] tw-bg-iron-800 tw-rounded-lg"></div>
        </div>
      ) : isError ? (
        <div className="tw-text-red-500 tw-text-center tw-py-4">
          <p>Error loading wave data</p>
          <p className="tw-text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      ) : wave ? (
        <CreateDropContent
          activeDrop={activeDrop}
          rootDropId={rootDropId}
          onCancelReplyQuote={onCancelReplyQuote}
          wave={wave}
          drop={drop}
          isStormMode={isStormMode}
          setDrop={setDrop}
          setIsStormMode={setIsStormMode}
          onDropCreated={onDropCreated}
        />
      ) : null}
    </div>
  );
}
