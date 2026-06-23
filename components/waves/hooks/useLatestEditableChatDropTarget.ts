"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { WaveMessages } from "@/contexts/wave/hooks/types";
import type { Listener as WaveMessagesListener } from "@/contexts/wave/hooks/useWaveMessagesStore";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useCallback, useEffect, useState } from "react";
import { getLatestEditableChatDrop } from "../utils/getLatestEditableChatDrop";

type LatestEditableChatDropTarget = {
  readonly id: string;
  readonly serialNo: number;
};

type ConnectedProfile = Pick<ApiIdentity, "id" | "handle"> | null | undefined;

type TargetState = {
  readonly waveId: string;
  readonly connectedProfileId: string | null;
  readonly connectedProfileHandle: string | null;
  readonly isProxyMode: boolean;
  readonly target: LatestEditableChatDropTarget | null;
};

const getTargetFromWaveMessages = ({
  waveMessages,
  waveId,
  connectedProfileId,
  connectedProfileHandle,
  isProxyMode,
}: {
  readonly waveMessages: WaveMessages | undefined;
  readonly waveId: string;
  readonly connectedProfileId: string | null;
  readonly connectedProfileHandle: string | null;
  readonly isProxyMode: boolean;
}): LatestEditableChatDropTarget | null => {
  const connectedProfile =
    connectedProfileId || connectedProfileHandle
      ? {
          id: connectedProfileId ?? "",
          handle: connectedProfileHandle ?? "",
        }
      : null;
  const latestDrop = getLatestEditableChatDrop({
    drops: waveMessages?.drops,
    waveId,
    connectedProfile,
    isProxyMode,
  });

  return latestDrop
    ? { id: latestDrop.id, serialNo: latestDrop.serial_no }
    : null;
};

export function useLatestEditableChatDropTarget({
  waveId,
  connectedProfile,
  isProxyMode,
}: {
  readonly waveId: string;
  readonly connectedProfile: ConnectedProfile;
  readonly isProxyMode: boolean;
}): LatestEditableChatDropTarget | null {
  const { waveMessagesStore } = useMyStream();
  const { getData, subscribe, unsubscribe } = waveMessagesStore;
  const connectedProfileId = connectedProfile?.id ?? null;
  const connectedProfileHandle = connectedProfile?.handle ?? null;
  const hasEditableProfile = Boolean(
    connectedProfileId || connectedProfileHandle
  );

  const getTarget = useCallback(
    (waveMessages: WaveMessages | undefined) =>
      getTargetFromWaveMessages({
        waveMessages,
        waveId,
        connectedProfileId,
        connectedProfileHandle,
        isProxyMode,
      }),
    [connectedProfileHandle, connectedProfileId, isProxyMode, waveId]
  );

  const createTargetState = useCallback(
    (waveMessages: WaveMessages | undefined): TargetState => ({
      waveId,
      connectedProfileId,
      connectedProfileHandle,
      isProxyMode,
      target: getTarget(waveMessages),
    }),
    [connectedProfileHandle, connectedProfileId, getTarget, isProxyMode, waveId]
  );

  const [targetState, setTargetState] = useState<TargetState>(() =>
    createTargetState(getData(waveId))
  );

  useEffect(() => {
    const updateTarget = (waveMessages: WaveMessages | undefined) => {
      const nextState = createTargetState(waveMessages);

      setTargetState((currentState) => {
        if (
          currentState.waveId === nextState.waveId &&
          currentState.connectedProfileId === nextState.connectedProfileId &&
          currentState.connectedProfileHandle ===
            nextState.connectedProfileHandle &&
          currentState.isProxyMode === nextState.isProxyMode &&
          currentState.target?.id === nextState.target?.id &&
          currentState.target?.serialNo === nextState.target?.serialNo
        ) {
          return currentState;
        }

        return nextState;
      });
    };

    const listener: WaveMessagesListener = (waveMessages) => {
      updateTarget(waveMessages);
    };

    if (!hasEditableProfile || isProxyMode) {
      updateTarget(undefined);
      return;
    }

    subscribe(waveId, listener);

    return () => {
      unsubscribe(waveId, listener);
    };
  }, [
    createTargetState,
    hasEditableProfile,
    isProxyMode,
    subscribe,
    unsubscribe,
    waveId,
  ]);

  if (
    targetState.waveId === waveId &&
    targetState.connectedProfileId === connectedProfileId &&
    targetState.connectedProfileHandle === connectedProfileHandle &&
    targetState.isProxyMode === isProxyMode
  ) {
    return targetState.target;
  }

  return createTargetState(getData(waveId)).target;
}
