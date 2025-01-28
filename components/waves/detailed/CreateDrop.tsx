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
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropMode } from "./PrivilegedDropCreator";
import { DropPrivileges } from "../../../hooks/useDropPriviledges";

interface CreateDropProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly onDropAddedToQueue: () => void;
  readonly onAllDropsAdded?: () => void;
  readonly wave: ApiWave;
  readonly dropId: string | null;
  readonly fixedDropMode: DropMode;
  readonly privileges: DropPrivileges;
}

const ANIMATION_DURATION = 0.3;

export default function CreateDrop({
  activeDrop,
  onCancelReplyQuote,
  onDropAddedToQueue,
  onAllDropsAdded,
  wave,
  dropId,
  fixedDropMode,
  privileges,
}: CreateDropProps) {
  const { setToast } = useContext(AuthContext);
  const { waitAndInvalidateDrops } = useContext(ReactQueryWrapperContext);
  useKeyPressEvent("Escape", () => onCancelReplyQuote());
  const [isStormMode, setIsStormMode] = useState(false);
  const [drop, setDrop] = useState<CreateDropConfig | null>(null);

  const getIsDropMode = () => {
    if (fixedDropMode === DropMode.CHAT) {
      return false;
    }
    if (fixedDropMode === DropMode.PARTICIPATION) {
      return true;
    }
    if (wave.chat.authenticated_user_eligible) return false;
    if (wave.participation.authenticated_user_eligible) return true;
    if (activeDrop) return false;
    return false;
  };

  const [isDropMode, setIsDropMode] = useState(getIsDropMode());
  useEffect(() => setIsDropMode(getIsDropMode()), [wave, activeDrop]);

  const getIsDropModeDisabled = () => {
    if (!wave.participation.authenticated_user_eligible) return true;
    if (activeDrop) return true;
    return false;
  };

  const [dropModeDisabled, setDropModeDisabled] = useState(
    getIsDropModeDisabled()
  );

  useEffect(
    () => setDropModeDisabled(getIsDropModeDisabled()),
    [wave, activeDrop]
  );

  const onDropModeChange = useCallback(
    (newIsDropMode: boolean) => {
      if (fixedDropMode !== DropMode.BOTH) {
        return;
      }
      if (newIsDropMode && !wave.participation.authenticated_user_eligible) {
        setToast({
          message: "You are not eligible to drop in this wave",
          type: "error",
        });
        return;
      }

      if (!newIsDropMode && !wave.chat.authenticated_user_eligible) {
        setToast({
          message: "You are not eligible to chat in this wave",
          type: "error",
        });
        return;
      }

      setIsDropMode(newIsDropMode);
    },
    [wave]
  );

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
        waitAndInvalidateDrops();
        onAllDropsAdded?.();
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
      onDropAddedToQueue();
    },
    [addToQueue, onCancelReplyQuote]
  );

  const createDropContentProps = useMemo(
    () => ({
      activeDrop,
      onCancelReplyQuote,
      drop,
      isStormMode,
      isDropMode,
      dropId,
      setDrop,
      setIsStormMode,
      onDropModeChange,
      submitDrop,
      dropModeDisabled,
      privileges,
    }),
    [
      activeDrop,
      onCancelReplyQuote,
      drop,
      isStormMode,
      isDropMode,
      dropId,
      setDrop,
      setIsStormMode,
      onDropModeChange,
      submitDrop,
      dropModeDisabled,
      privileges,
    ]
  );

  return (
    <>
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

      <CreateDropContent {...createDropContentProps} wave={wave} />
    </>
  );
}
