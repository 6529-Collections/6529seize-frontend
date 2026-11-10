"use client";

import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import { DropSize, type Drop } from "@/helpers/waves/drop.helpers";
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
  readonly viewerProfileId?: string | null | undefined;
}

const isOwnDrop = (drop: Drop, viewerProfileId: string | null): boolean =>
  viewerProfileId !== null &&
  drop.type === DropSize.FULL &&
  drop.author.id === viewerProfileId;

// Pending sends use epoch timestamps as serials, outside the server sequence.
const getLatestAcceptedSerial = (
  waveMessages: WaveMessagesResult
): number | null => {
  let latest: number | null = null;
  for (const drop of waveMessages?.drops ?? []) {
    if (drop.id.startsWith("temp-") || !Number.isFinite(drop.serial_no)) {
      continue;
    }
    latest = Math.max(latest ?? drop.serial_no, drop.serial_no);
  }
  return latest;
};

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
  shouldDefer,
  visibleLatestSerial,
  waveMessages,
  viewerProfileId,
}: {
  readonly shouldDefer: boolean;
  readonly visibleLatestSerial: number | null;
  readonly waveMessages: WaveMessagesResult;
  readonly viewerProfileId: string | null;
}): WaveMessagesResult => {
  if (!waveMessages) {
    return waveMessages;
  }

  if (!shouldDefer || visibleLatestSerial === null) {
    return waveMessages;
  }

  const filteredDrops = waveMessages.drops.filter((drop) => {
    if (isOwnDrop(drop, viewerProfileId)) {
      return true;
    }
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
  shouldDefer,
  visibleLatestSerial,
  waveMessages,
  viewerProfileId,
}: {
  readonly shouldDefer: boolean;
  readonly visibleLatestSerial: number | null;
  readonly waveMessages: WaveMessagesResult;
  readonly viewerProfileId: string | null;
}): number => {
  const drops = waveMessages?.drops;

  if (
    !shouldDefer ||
    !drops ||
    drops.length === 0 ||
    visibleLatestSerial === null
  ) {
    return 0;
  }

  return drops.reduce((count, drop) => {
    if (
      isOwnDrop(drop, viewerProfileId) ||
      typeof drop.serial_no !== "number"
    ) {
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
  viewerProfileId = null,
}: UseDeferredNewestDropsProps): DeferredNewestDropsState {
  const latestSerialNo = getLatestAcceptedSerial(waveMessages);
  const shouldDefer = isAppleMobile && !shouldPinToBottom;
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
      setSession(nextSession);
    }
  }, [isAppleMobile, latestSerialNo, session, shouldPinToBottom, waveId]);

  const renderedWaveMessages = useMemo(
    () =>
      filterDeferredDrops({
        shouldDefer,
        visibleLatestSerial,
        waveMessages,
        viewerProfileId,
      }),
    [shouldDefer, visibleLatestSerial, waveMessages, viewerProfileId]
  );

  const pendingDropsCount = useMemo(
    () =>
      getPendingDropsCount({
        shouldDefer,
        visibleLatestSerial,
        waveMessages,
        viewerProfileId,
      }),
    [shouldDefer, visibleLatestSerial, waveMessages, viewerProfileId]
  );

  const revealPendingDrops = useCallback(() => {
    const newestSerial = getLatestAcceptedSerial(waveMessages);
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
