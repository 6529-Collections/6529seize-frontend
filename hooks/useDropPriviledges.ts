"use client";

import { isSlowModeCoolingDown } from "@/helpers/waves/slow-mode.helpers";
import { useEffect, useMemo, useRef, useState } from "react";

enum SubmissionStatus {
  NOT_STARTED = "NOT_STARTED",
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
}

export enum SubmissionRestriction {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  NEEDS_PROFILE = "NEEDS_PROFILE",
  PROXY_USER = "PROXY_USER",
  NO_PERMISSION = "NO_PERMISSION",
  NOT_STARTED = "NOT_STARTED",
  ENDED = "ENDED",
  MAX_DROPS_REACHED = "MAX_DROPS_REACHED",
}

export enum ChatRestriction {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  NEEDS_PROFILE = "NEEDS_PROFILE",
  PROXY_USER = "PROXY_USER",
  SLOW_MODE = "SLOW_MODE",
  NO_PERMISSION = "NO_PERMISSION",
  DISABLED = "DISABLED",
}

interface DropPrivilegesInput {
  readonly isLoggedIn: boolean;
  readonly needsProfile?: boolean | undefined;
  readonly isProxy: boolean;
  readonly canChat: boolean;
  readonly canDrop: boolean;
  readonly chatDisabled: boolean;
  readonly slowModeCooldownMs: number | null;
  readonly nextDropAllowed: number | null;
  readonly submissionStarts: number | null;
  readonly submissionEnds: number | null;
  readonly maxDropsCount: number | null;
  readonly identityDropsCount: number | null;
  readonly onSlowModeCooldownExpired?: (() => void) | undefined;
}

export interface DropPrivileges {
  readonly submissionRestriction: SubmissionRestriction | null;
  readonly chatRestriction: ChatRestriction | null;
}

export function useDropPrivileges({
  isLoggedIn,
  needsProfile = false,
  isProxy,
  canChat,
  canDrop,
  chatDisabled,
  slowModeCooldownMs,
  nextDropAllowed,
  submissionStarts,
  submissionEnds,
  maxDropsCount,
  identityDropsCount,
  onSlowModeCooldownExpired,
}: DropPrivilegesInput): DropPrivileges {
  const [slowModeClockTick, setSlowModeClockTick] = useState(0);
  const notifiedExpiredSlowModeRef = useRef<number | null>(null);

  useEffect(() => {
    if (slowModeCooldownMs === null || nextDropAllowed === null) {
      return;
    }

    const notifyExpiredSlowMode = () => {
      if (
        canChat ||
        onSlowModeCooldownExpired === undefined ||
        notifiedExpiredSlowModeRef.current === nextDropAllowed
      ) {
        return;
      }

      notifiedExpiredSlowModeRef.current = nextDropAllowed;
      onSlowModeCooldownExpired();
    };

    const remainingMs = nextDropAllowed - Date.now();
    if (remainingMs <= 0) {
      notifyExpiredSlowMode();
      return;
    }

    const timeout = setTimeout(() => {
      setSlowModeClockTick((current) => current + 1);
      notifyExpiredSlowMode();
    }, remainingMs);

    return () => clearTimeout(timeout);
  }, [canChat, nextDropAllowed, onSlowModeCooldownExpired, slowModeCooldownMs]);

  return useMemo(() => {
    const now = Date.now();

    let submissionStatus: SubmissionStatus;

    // Case 1: No time restrictions at all - always active
    if (submissionStarts === null && submissionEnds === null) {
      submissionStatus = SubmissionStatus.ACTIVE;
    }
    // Case 2: Only end time exists - active until end time
    else if (submissionStarts === null && submissionEnds !== null) {
      submissionStatus =
        now <= submissionEnds
          ? SubmissionStatus.ACTIVE
          : SubmissionStatus.ENDED;
    }
    // Case 3: Only start time exists - not started before start, active after
    else if (submissionEnds === null && submissionStarts !== null) {
      submissionStatus =
        now < submissionStarts
          ? SubmissionStatus.NOT_STARTED
          : SubmissionStatus.ACTIVE;
    }
    // Case 4: Both start and end times exist - full range checking
    else if (submissionStarts !== null && submissionEnds !== null) {
      if (now < submissionStarts) {
        submissionStatus = SubmissionStatus.NOT_STARTED;
      } else if (now > submissionEnds) {
        submissionStatus = SubmissionStatus.ENDED;
      } else {
        submissionStatus = SubmissionStatus.ACTIVE;
      }
    } else {
      submissionStatus = SubmissionStatus.NOT_STARTED;
    }

    const hasReachedMaxDrops =
      maxDropsCount !== null &&
      identityDropsCount !== null &&
      identityDropsCount >= maxDropsCount;
    const isChatCoolingDown = isSlowModeCoolingDown({
      cooldownMs: slowModeCooldownMs,
      nextDropAllowed,
      now,
    });
    let submissionRestriction: SubmissionRestriction | null = null;
    if (isProxy) {
      submissionRestriction = SubmissionRestriction.PROXY_USER;
    } else if (needsProfile) {
      submissionRestriction = SubmissionRestriction.NEEDS_PROFILE;
    } else if (!isLoggedIn) {
      submissionRestriction = SubmissionRestriction.NOT_LOGGED_IN;
    } else if (!canDrop) {
      submissionRestriction = SubmissionRestriction.NO_PERMISSION;
    } else if (hasReachedMaxDrops) {
      submissionRestriction = SubmissionRestriction.MAX_DROPS_REACHED;
    } else if (submissionStatus === SubmissionStatus.NOT_STARTED) {
      submissionRestriction = SubmissionRestriction.NOT_STARTED;
    } else if (submissionStatus === SubmissionStatus.ENDED) {
      submissionRestriction = SubmissionRestriction.ENDED;
    }

    let chatRestriction: ChatRestriction | null = null;
    if (isProxy) {
      chatRestriction = ChatRestriction.PROXY_USER;
    } else if (needsProfile) {
      chatRestriction = ChatRestriction.NEEDS_PROFILE;
    } else if (!isLoggedIn) {
      chatRestriction = ChatRestriction.NOT_LOGGED_IN;
    } else if (chatDisabled) {
      chatRestriction = ChatRestriction.DISABLED;
    } else if (isChatCoolingDown) {
      chatRestriction = ChatRestriction.SLOW_MODE;
    } else if (!canChat) {
      chatRestriction = ChatRestriction.NO_PERMISSION;
    }

    return { submissionRestriction, chatRestriction };
  }, [
    isLoggedIn,
    needsProfile,
    isProxy,
    canChat,
    canDrop,
    chatDisabled,
    slowModeCooldownMs,
    nextDropAllowed,
    submissionStarts,
    submissionEnds,
    maxDropsCount,
    identityDropsCount,
    slowModeClockTick,
  ]);
}
