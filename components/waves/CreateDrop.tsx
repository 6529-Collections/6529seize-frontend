"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { CreateDropConfig } from "../../entities/IDrop";
import CreateDropStormParts from "./CreateDropStormParts";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropContent from "./CreateDropContent";
import { useMutation } from "@tanstack/react-query";
import { ApiWave } from "../../generated/models/ApiWave";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiPost } from "../../services/api/common-api";
import { ApiCreateDropRequest } from "../../generated/models/ApiCreateDropRequest";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { AuthContext } from "../auth/Auth";
import { useProgressiveDebounce } from "../../hooks/useProgressiveDebounce";
import { useKeyPressEvent } from "react-use";
import { ActiveDropState } from "../../types/dropInteractionTypes";
import { DropMode } from "./PrivilegedDropCreator";
import { DropPrivileges } from "../../hooks/useDropPriviledges";
import { useMyStream } from "../../contexts/wave/MyStreamContext";

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

export interface DropMutationBody {
  readonly drop: ApiCreateDropRequest;
  readonly dropId: string | null;
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
  const { processDropRemoved } = useMyStream();
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
    mutationFn: async (body: DropMutationBody) => {
      await commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint: `drops`,
        body: body.drop,
      });
    },
    onError: (error, body) => {
      setTimeout(() => {
        if (body.dropId) {
          processDropRemoved(body.drop.wave_id, body.dropId);
        }
      }, 0);
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    },
    retry: (failureCount) => {
      if (failureCount >= 3) {
        return false;
      }
      return true;
    },
    retryDelay: (failureCount) => {
      return failureCount * 1000;
    },
  });

  const [queueSize, setQueueSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasQueueChanged, setHasQueueChanged] = useState(false);
  const queueRef = useRef<DropMutationBody[]>([]);

  const addToQueue = useCallback(
    (dropRequest: DropMutationBody) => {
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
    if (queueRef.current.length === 0) {
      return undefined;
    }
    const item = queueRef.current.shift();
    const newQueueSize = queueRef.current.length;
    setQueueSize(newQueueSize);
    return item;
  }, []);

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
    if (isProcessing) return;
    setIsProcessing(true);

    const dropRequest = removeFromQueue();

    if (dropRequest) {
      try {
        await addDropMutation.mutateAsync(dropRequest);
      } catch (error) {
        console.error("Error processing drop:", error);
      }
    }

    setIsProcessing(false);
  }, [isProcessing, removeFromQueue, addDropMutation]);

  useEffect(() => {
    processQueue();
  }, [processQueue, queueSize]);

  const submitDrop = useCallback(
    (dropRequest: DropMutationBody) => {
      addToQueue(dropRequest);
      onDropAddedToQueue();
      // Explicitly blur any focused input to close keyboard
      (document.activeElement as HTMLElement)?.blur();
    },
    [addToQueue, onDropAddedToQueue]
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
            transition={{ duration: ANIMATION_DURATION }}>
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
