import { ActiveDropState } from "./WaveDetailedContent";
import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { CreateDropConfig } from "../../../entities/IDrop";
import CreateDropStormParts from "./CreateDropStormParts";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropContent from "./CreateDropContent";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Wave } from "../../../generated/models/Wave";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../react-query-wrapper/ReactQueryWrapper";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../services/api/common-api";
import { CreateDropRequest } from "../../../generated/models/CreateDropRequest";
import { Drop } from "../../../generated/models/Drop";
import { AuthContext } from "../../auth/Auth";
import { useProgressiveDebounce } from "../../../hooks/useProgressiveDebounce";

interface CreateDropProps {
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly onCancelReplyQuote: () => void;
  readonly waveId: string;
}

const ANIMATION_DURATION = 0.3;

function useResizeObserver(
  containerRef: React.RefObject<HTMLDivElement>,
  fixedBottomRef: React.RefObject<HTMLDivElement>
) {
  useEffect(() => {
    const container = containerRef.current!;
    const fixedBottom = fixedBottomRef.current!;

    const observer = new ResizeObserver(() => {
      const containerRect = container.getBoundingClientRect();
      const fixedBottomRect = fixedBottom.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (fixedBottomRect.bottom > viewportHeight) {
        window.scrollTo({
          top: window.scrollY + (fixedBottomRect.bottom - viewportHeight) + 20,
          behavior: "smooth",
        });
      } else if (fixedBottomRect.bottom < viewportHeight) {
        const newScrollTop = Math.max(
          0,
          window.scrollY - (viewportHeight - fixedBottomRect.bottom) + 20
        );
        window.scrollTo({
          top: newScrollTop,
          behavior: "smooth",
        });
      }

      if (containerRect.top < 0) {
        window.scrollTo({
          top: window.scrollY + containerRect.top,
          behavior: "smooth",
        });
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef, fixedBottomRef]);
}

export default function CreateDrop({
  activeDrop,
  rootDropId,
  onCancelReplyQuote,
  waveId,
}: CreateDropProps) {
  const { setToast } = useContext(AuthContext);
  const { waitAndInvalidateDrops } = useContext(ReactQueryWrapperContext);
  const [isStormMode, setIsStormMode] = useState(false);
  const [drop, setDrop] = useState<CreateDropConfig | null>(null);

  const onRemovePart = useCallback((partIndex: number) => {
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
  }, []);

  const {
    data: wave,
    isFetching,
    isError,
    error,
  } = useQuery<Wave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () =>
      await commonApiFetch<Wave>({
        endpoint: `waves/${waveId}`,
      }),
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const fixedBottomRef = useRef<HTMLDivElement>(null);

  useResizeObserver(containerRef, fixedBottomRef);

  const addDropMutation = useMutation({
    mutationFn: async (body: CreateDropRequest) =>
      await commonApiPost<CreateDropRequest, Drop>({
        endpoint: `drops`,
        body,
      }),

    onError: (error) => {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    },
  });

  const [queueSize, setQueueSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasQueueChanged, setHasQueueChanged] = useState(false);
  const queueRef = useRef<CreateDropRequest[]>([]);

  const addToQueue = useCallback((dropRequest: CreateDropRequest) => {
    queueRef.current.push(dropRequest);
    setQueueSize(queueRef.current.length);
    setHasQueueChanged(true);
  }, []);

  const removeFromQueue = useCallback(() => {
    const item = queueRef.current.shift();
    setQueueSize(queueRef.current.length);
    return item;
  }, []);

  const currentDelay = useProgressiveDebounce(
    () => {
      if (queueSize === 0 && !isProcessing && hasQueueChanged) {
        waitAndInvalidateDrops();
      }
    },
    [queueSize, isProcessing, hasQueueChanged],
    {
      minDelay: 1000,
      maxDelay: 5000,
      increaseFactor: 1.5,
      decreaseFactor: 1.2,
    }
  );

  useEffect(() => {
    console.log(`Current debounce delay: ${currentDelay}ms`);
  }, [currentDelay]);

  const processQueue = useCallback(async () => {
    if (isProcessing || queueSize === 0) return;
    setIsProcessing(true);

    const dropRequest = removeFromQueue();

    if (dropRequest) {
      try {
        await addDropMutation.mutateAsync(dropRequest);
      } catch (error) {
        console.error("Error processing drop:", error);
      }
    } else {
      console.warn("No drop request found in queue, but queue.size was not 0");
    }

    setIsProcessing(false);
  }, [
    isProcessing,
    queueSize,
    removeFromQueue,
    addDropMutation,
    waitAndInvalidateDrops,
  ]);

  useEffect(() => {
    processQueue();
  }, [processQueue, queueSize]);

  const submitDrop = useCallback(
    (dropRequest: CreateDropRequest) => {
      addToQueue(dropRequest);
    },
    [addToQueue]
  );

  return (
    <div
      ref={containerRef}
      className="tw-py-4 tw-px-4 tw-top-0 tw-sticky tw-z-10 tw-w-full tw-rounded-b-xl tw-backdrop-blur tw-flex-none tw-transition-colors tw-duration-500 tw-lg:z-50 tw-border-t tw-border-solid tw-border-b-0 tw-border-x-0 tw-border-iron-50/[0.06] tw-supports-backdrop-blur:tw-bg-white/95 tw-bg-iron-950/80"
    >
      <AnimatePresence>
        {isStormMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: ANIMATION_DURATION }}
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
        <div className="tw-text-red tw-text-center tw-py-4">
          <p>Error loading wave data</p>
          <p className="tw-text-sm">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
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
          submitDrop={submitDrop}
        />
      ) : null}
      <div ref={fixedBottomRef}></div>
    </div>
  );
}
