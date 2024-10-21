import { ActiveDropState } from "./WaveDetailedContent";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { CreateDropConfig } from "../../../entities/IDrop";
import CreateDropStormParts from "./CreateDropStormParts";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropContent from "./CreateDropContent";
import { useMutation } from "@tanstack/react-query";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiPost } from "../../../services/api/common-api";
import { ApiCreateDropRequest } from "../../../generated/models/ApiCreateDropRequest";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { AuthContext } from "../../auth/Auth";
import { useProgressiveDebounce } from "../../../hooks/useProgressiveDebounce";
import { useKeyPressEvent } from "react-use";
import { useDebouncedCallback } from "use-debounce";
import useCapacitor from "../../../hooks/useCapacitor";

interface CreateDropProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly wave: ApiWave;
}

const ANIMATION_DURATION = 0.3;

function useResizeObserver(
  containerRef: React.RefObject<HTMLDivElement>,
  fixedBottomRef: React.RefObject<HTMLDivElement>
) {
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const fixedBottom = fixedBottomRef.current;
    if (!container || !fixedBottom) return;
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
  }, [containerRef, fixedBottomRef]);

  const debouncedHandleResize = useDebouncedCallback(handleResize, 100);

  useEffect(() => {
    if (!containerRef.current || !fixedBottomRef.current) return;
    const observer = new ResizeObserver(debouncedHandleResize);
    observer.observe(containerRef.current);
    observer.observe(fixedBottomRef.current);

    return () => observer.disconnect();
  }, [debouncedHandleResize, containerRef, fixedBottomRef]);
}

export default function CreateDrop({
  activeDrop,
  onCancelReplyQuote,
  wave,
}: CreateDropProps) {
  const capacitor = useCapacitor();
  const { setToast } = useContext(AuthContext);
  const { waitAndInvalidateDrops } = useContext(ReactQueryWrapperContext);
  useKeyPressEvent("Escape", () => onCancelReplyQuote());
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

  const containerRef = useRef<HTMLDivElement>(null);
  const fixedBottomRef = useRef<HTMLDivElement>(null);

  useResizeObserver(containerRef, fixedBottomRef);

  const addDropMutation = useMutation({
    mutationFn: async (body: ApiCreateDropRequest) =>
      await commonApiPost<ApiCreateDropRequest, ApiDrop>({
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
  const queueRef = useRef<ApiCreateDropRequest[]>([]);

  const addToQueue = useCallback(
    (dropRequest: ApiCreateDropRequest) => {
      queueRef.current.push(dropRequest);
      const newQueueSize = queueRef.current.length;
      if (newQueueSize !== queueSize) {
        setQueueSize(newQueueSize);
        setHasQueueChanged(true);
      }
    },
    [queueSize]
  );

  const removeFromQueue = useCallback(() => {
    const item = queueRef.current.shift();
    const newQueueSize = queueRef.current.length;
    if (newQueueSize !== queueSize) {
      setQueueSize(newQueueSize);
    }
    return item;
  }, [queueSize]);

  useProgressiveDebounce(
    () => {
      if (queueSize === 0 && !isProcessing && hasQueueChanged) {
        console.log("are you sure its called?????");
        waitAndInvalidateDrops();
      }
    },
    [queueSize, isProcessing, hasQueueChanged],
    {
      minDelay: 1000,
      maxDelay: 4000,
      increaseFactor: 1.5,
      decreaseFactor: 1.2,
    }
  );

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
    (dropRequest: ApiCreateDropRequest) => {
      addToQueue(dropRequest);
      onCancelReplyQuote();
    },
    [addToQueue, onCancelReplyQuote]
  );

  const createDropContentProps = useMemo(
    () => ({
      activeDrop,
      onCancelReplyQuote,
      drop,
      isStormMode,
      setDrop,
      setIsStormMode,
      submitDrop,
    }),
    [
      activeDrop,
      onCancelReplyQuote,
      drop,
      isStormMode,
      setDrop,
      setIsStormMode,
      submitDrop,
    ]
  );

  const containerClassName = useMemo(() => {
    return capacitor.isCapacitor
      ? "tw-max-h-[calc(100vh-14.7rem)] tw-mb-[3.75rem]"
      : "tw-max-h-[calc(100vh-8.8rem)] lg:tw-max-h-[calc(100vh-7.5rem)]";
  }, [capacitor.isCapacitor]);

  return (
    <div
      ref={containerRef}
      className={`${containerClassName} tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-py-4 tw-px-4 tw-top-0 tw-sticky tw-z-10 tw-w-full tw-rounded-b-xl tw-flex-none tw-transition-colors tw-duration-500 tw-lg:z-50 tw-border-t tw-border-solid tw-border-b-0 tw-border-x-0 tw-border-iron-700  tw-bg-iron-950`}
    >
      <AnimatePresence>
        {isStormMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: ANIMATION_DURATION }}u
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

      <CreateDropContent {...createDropContentProps} wave={wave} />
      <div ref={fixedBottomRef}></div>
    </div>
  );
}
