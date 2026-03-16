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

interface DeferredNewestDropsViewState {
  readonly nextSession: DeferredNewestDropsSession;
  readonly visibleLatestSerial: number | null;
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

const getDeferredNewestDropsViewState = ({
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
}): DeferredNewestDropsViewState => {
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

    return {
      nextSession: updateDeferredNewestDropsSession({ session, nextSession }),
      visibleLatestSerial: latestSerialNo,
    };
  }

  if (shouldPinToBottom) {
    nextSession = {
      ...nextSession,
      wasPinned: true,
      capturedLatestSerial: null,
      revealedLatestSerial: null,
    };

    return {
      nextSession: updateDeferredNewestDropsSession({ session, nextSession }),
      visibleLatestSerial: latestSerialNo,
    };
  }

  const capturedLatestSerial =
    nextSession.wasPinned && latestSerialNo !== null
      ? latestSerialNo
      : nextSession.capturedLatestSerial;

  nextSession = {
    ...nextSession,
    wasPinned: false,
    capturedLatestSerial,
  };

  return {
    nextSession: updateDeferredNewestDropsSession({ session, nextSession }),
    visibleLatestSerial:
      nextSession.revealedLatestSerial ??
      nextSession.capturedLatestSerial ??
      latestSerialNo,
  };
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

  const { nextSession, visibleLatestSerial } = getDeferredNewestDropsViewState({
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
    if (session !== nextSession) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- This commits the derived session before the next paint so deferred-drop capture stays in sync with the current render inputs.
      setSession(nextSession);
    }
  }, [nextSession, session]);

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
