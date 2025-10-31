"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { CreateDropConfig } from "@/entities/IDrop";
import CreateDropStormParts from "./CreateDropStormParts";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropContent from "./CreateDropContent";
import { useMutation } from "@tanstack/react-query";
import { ApiWave } from "@/generated/models/ApiWave";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiPost } from "@/services/api/common-api";
import { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { AuthContext } from "../auth/Auth";
import { useProgressiveDebounce } from "@/hooks/useProgressiveDebounce";
import { useKeyPressEvent } from "react-use";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { DropMode } from "./PrivilegedDropCreator";
import { DropPrivileges } from "@/hooks/useDropPriviledges";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";

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
  const { processDropRemoved, processIncomingDrop } = useMyStream();
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
      return commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint: `drops`,
        body: body.drop,
      });
    },
    onSuccess: (serverDrop, body) => {
      if (body.dropId) {
        processDropRemoved(body.drop.wave_id, body.dropId);
      }
      processIncomingDrop(serverDrop, ProcessIncomingDropType.DROP_INSERT);
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

  // Use refs to avoid stale closures - fixes the stream unmounting issue
  const queueRef = useRef<DropMutationBody[]>([]);
  const isProcessingRef = useRef(false);
  const [hasQueueChanged, setHasQueueChanged] = useState(false);

  useProgressiveDebounce(
    () => {
      if (queueRef.current.length === 0 && !isProcessingRef.current && hasQueueChanged) {
        waitAndInvalidateDrops();
        onAllDropsAdded?.();
      }
    },
    [hasQueueChanged],
    {
      minDelay: 1000,
      maxDelay: 4000,
      increaseFactor: 1.5,
      decreaseFactor: 1.2,
    }
  );

  const processNextDrop = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const dropRequest = queueRef.current.shift();

    if (dropRequest) {
      try {
        await addDropMutation.mutateAsync(dropRequest);
      } catch (error) {
        console.error("Error processing drop:", error);
      }
    }

    isProcessingRef.current = false;

    // Process next item if queue has more
    if (queueRef.current.length > 0) {
      processNextDrop();
    }
  }, [addDropMutation]);

  const submitDrop = useCallback(
    (dropRequest: DropMutationBody) => {
      // Add to queue
      queueRef.current.push(dropRequest);
      setHasQueueChanged(true);
      
      // Process immediately - avoids state update timing issues
      processNextDrop();
      
      // Trigger UI updates
      onDropAddedToQueue();
      
      // Explicitly blur any focused input to close keyboard
      (document.activeElement as HTMLElement)?.blur();
    },
    [onDropAddedToQueue, processNextDrop]
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
