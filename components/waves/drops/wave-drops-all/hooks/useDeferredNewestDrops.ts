"use client";

import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

type WaveMessagesResult = ReturnType<
  typeof useVirtualizedWaveDrops
>["waveMessages"];

interface DeferredNewestDropsState {
  readonly renderedWaveMessages: WaveMessagesResult;
  readonly pendingDropsCount: number;
  readonly revealPendingDrops: () => void;
}

interface UseDeferredNewestDropsProps {
  readonly waveId: string;
  readonly isAppleMobile: boolean;
  readonly waveMessages: WaveMessagesResult;
  readonly shouldPinToBottom: boolean;
}

interface DeferredNewestDropsSession {
  readonly waveId: string;
  readonly wasPinned: boolean;
  readonly capturedLatestSerial: number | null;
  readonly revealedLatestSerial: number | null;
}

interface DeferredNewestDropsInputsSnapshot {
  readonly waveId: string;
  readonly latestSerialNo: number | null;
  readonly shouldPinToBottom: boolean;
}

const createDeferredNewestDropsSession = (
  waveId: string
): DeferredNewestDropsSession => ({
  waveId,
  wasPinned: true,
  capturedLatestSerial: null,
  revealedLatestSerial: null,
});

const updateDeferredNewestDropsSession = ({
  session,
  nextSession,
}: {
  readonly session: DeferredNewestDropsSession;
  readonly nextSession: DeferredNewestDropsSession;
}): DeferredNewestDropsSession =>
  session.waveId === nextSession.waveId &&
  session.wasPinned === nextSession.wasPinned &&
  session.capturedLatestSerial === nextSession.capturedLatestSerial &&
  session.revealedLatestSerial === nextSession.revealedLatestSerial
    ? session
    : nextSession;

const getPreviousPinnedLatestSerial = ({
  previousInputs,
  waveId,
}: {
  readonly previousInputs: DeferredNewestDropsInputsSnapshot | null;
  readonly waveId: string;
}): number | null =>
  previousInputs?.waveId === waveId && previousInputs.shouldPinToBottom
    ? previousInputs.latestSerialNo
    : null;

const getDeferredNewestDropsVisibleLatestSerial = ({
  session,
  waveId,
  isAppleMobile,
  shouldPinToBottom,
  latestSerialNo,
}: {
  readonly session: DeferredNewestDropsSession;
  readonly waveId: string;
  readonly isAppleMobile: boolean;
  readonly shouldPinToBottom: boolean;
  readonly latestSerialNo: number | null;
}): number | null => {
  if (!isAppleMobile || shouldPinToBottom || session.waveId !== waveId) {
    return latestSerialNo;
  }

  return (
    session.revealedLatestSerial ??
    session.capturedLatestSerial ??
    latestSerialNo
  );
};

const getDeferredNewestDropsNextSession = ({
  session,
  waveId,
  isAppleMobile,
  shouldPinToBottom,
  latestSerialNo,
  previousInputs,
}: {
  readonly session: DeferredNewestDropsSession;
  readonly waveId: string;
  readonly isAppleMobile: boolean;
  readonly shouldPinToBottom: boolean;
  readonly latestSerialNo: number | null;
  readonly previousInputs: DeferredNewestDropsInputsSnapshot | null;
}): DeferredNewestDropsSession => {
  let nextSession =
    session.waveId === waveId
      ? session
      : createDeferredNewestDropsSession(waveId);

  if (!isAppleMobile) {
    nextSession = {
      ...nextSession,
      wasPinned: shouldPinToBottom,
      capturedLatestSerial: null,
      revealedLatestSerial: null,
    };

    return updateDeferredNewestDropsSession({ session, nextSession });
  }

  if (shouldPinToBottom) {
    nextSession = {
      ...nextSession,
      wasPinned: true,
      capturedLatestSerial: null,
      revealedLatestSerial: null,
    };

    return updateDeferredNewestDropsSession({ session, nextSession });
  }

  const previousPinnedLatestSerial = getPreviousPinnedLatestSerial({
    previousInputs,
    waveId,
  });
  const capturedLatestSerial = nextSession.wasPinned
    ? (previousPinnedLatestSerial ?? latestSerialNo)
    : nextSession.capturedLatestSerial;

  nextSession = {
    ...nextSession,
    wasPinned: false,
    capturedLatestSerial,
  };

  return updateDeferredNewestDropsSession({ session, nextSession });
};

const filterDeferredDrops = ({
  isAppleMobile,
  visibleLatestSerial,
  waveMessages,
}: {
  readonly isAppleMobile: boolean;
  readonly visibleLatestSerial: number | null;
  readonly waveMessages: WaveMessagesResult;
}): WaveMessagesResult => {
  if (!waveMessages) {
    return waveMessages;
  }

  if (!isAppleMobile || visibleLatestSerial === null) {
    return waveMessages;
  }

  const filteredDrops = waveMessages.drops.filter((drop) => {
    if (typeof drop.serial_no !== "number") {
      return true;
    }

    return drop.serial_no <= visibleLatestSerial;
  });

  if (filteredDrops.length === waveMessages.drops.length) {
    return waveMessages;
  }

  return {
    ...waveMessages,
    drops: filteredDrops,
  };
};

const getPendingDropsCount = ({
  isAppleMobile,
  visibleLatestSerial,
  waveMessages,
}: {
  readonly isAppleMobile: boolean;
  readonly visibleLatestSerial: number | null;
  readonly waveMessages: WaveMessagesResult;
}): number => {
  const drops = waveMessages?.drops;

  if (
    !isAppleMobile ||
    !drops ||
    drops.length === 0 ||
    visibleLatestSerial === null
  ) {
    return 0;
  }

  return drops.reduce((count, drop) => {
    if (typeof drop.serial_no !== "number") {
      return count;
    }

    return drop.serial_no > visibleLatestSerial ? count + 1 : count;
  }, 0);
};

export function useDeferredNewestDrops({
  waveId,
  isAppleMobile,
  waveMessages,
  shouldPinToBottom,
}: UseDeferredNewestDropsProps): DeferredNewestDropsState {
  const latestSerialNo = waveMessages?.drops[0]?.serial_no ?? null;
  const [session, setSession] = useState<DeferredNewestDropsSession>(() =>
    createDeferredNewestDropsSession(waveId)
  );
  const sessionRef = useRef(session);
  const previousInputsRef = useRef<DeferredNewestDropsInputsSnapshot | null>(
    null
  );

  const visibleLatestSerial = getDeferredNewestDropsVisibleLatestSerial({
    session,
    waveId,
    isAppleMobile,
    shouldPinToBottom,
    latestSerialNo,
  });

  useLayoutEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useLayoutEffect(() => {
    const nextSession = getDeferredNewestDropsNextSession({
      session,
      waveId,
      isAppleMobile,
      shouldPinToBottom,
      latestSerialNo,
      previousInputs: previousInputsRef.current,
    });

    previousInputsRef.current = {
      waveId,
      latestSerialNo,
      shouldPinToBottom,
    };

    if (session !== nextSession) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- This commits the derived session before the next paint so deferred-drop capture stays in sync with the current render inputs.
      setSession(nextSession);
    }
  }, [isAppleMobile, latestSerialNo, session, shouldPinToBottom, waveId]);

  const renderedWaveMessages = useMemo(
    () =>
      filterDeferredDrops({
        isAppleMobile,
        visibleLatestSerial,
        waveMessages,
      }),
    [isAppleMobile, visibleLatestSerial, waveMessages]
  );

  const pendingDropsCount = useMemo(
    () =>
      getPendingDropsCount({
        isAppleMobile,
        visibleLatestSerial,
        waveMessages,
      }),
    [isAppleMobile, visibleLatestSerial, waveMessages]
  );

  const revealPendingDrops = useCallback(() => {
    const newestSerial = waveMessages?.drops[0]?.serial_no ?? null;
    if (
      newestSerial === null ||
      sessionRef.current.revealedLatestSerial === newestSerial
    ) {
      return;
    }

    setSession((currentSession) =>
      currentSession.revealedLatestSerial === newestSerial
        ? currentSession
        : {
            ...currentSession,
            revealedLatestSerial: newestSerial,
          }
    );
  }, [waveMessages]);

  return {
    renderedWaveMessages,
    pendingDropsCount,
    revealPendingDrops,
  };
}
