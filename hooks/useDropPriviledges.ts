import { useMemo } from "react";

export enum SubmissionStatus {
  NOT_STARTED = "NOT_STARTED",
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
}

export enum ChatStatus {
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
}

export enum SubmissionRestriction {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  PROXY_USER = "PROXY_USER",
  NO_PERMISSION = "NO_PERMISSION",
  NOT_STARTED = "NOT_STARTED",
  ENDED = "ENDED",
  MAX_DROPS_REACHED = "MAX_DROPS_REACHED"
}

export enum ChatRestriction {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  PROXY_USER = "PROXY_USER",
  NO_PERMISSION = "NO_PERMISSION",
  DISABLED = "DISABLED",
}

export interface DropPrivilegesInput {
  readonly isLoggedIn: boolean;
  readonly isProxy: boolean;
  readonly canChat: boolean;
  readonly canDrop: boolean;
  readonly chatDisabled: boolean;
  readonly submissionStarts: number | null;
  readonly submissionEnds: number | null;
  readonly maxDropsCount: number | null;
  readonly identityDropsCount: number | null;
}

export interface DropPrivileges {
  readonly submissionRestriction: SubmissionRestriction | null;
  readonly chatRestriction: ChatRestriction | null;
}

export function useDropPrivileges({
  isLoggedIn,
  isProxy,
  canChat,
  canDrop,
  chatDisabled,
  submissionStarts,
  submissionEnds,
  maxDropsCount,
  identityDropsCount,
}: DropPrivilegesInput): DropPrivileges {
  return useMemo(() => {
    const now = Date.now();

    let submissionStatus: SubmissionStatus;
    
    // Case 1: No time restrictions at all - always active
    if (submissionStarts === null && submissionEnds === null) {
      submissionStatus = SubmissionStatus.ACTIVE;
    } 
    // Case 2: Only end time exists - active until end time
    else if (submissionStarts === null && submissionEnds !== null) {
      submissionStatus = now <= submissionEnds
        ? SubmissionStatus.ACTIVE 
        : SubmissionStatus.ENDED;
    } 
    // Case 3: Only start time exists - not started before start, active after
    else if (submissionEnds === null && submissionStarts !== null) {
      submissionStatus = now < submissionStarts 
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

    return {
      submissionRestriction: !isLoggedIn 
        ? SubmissionRestriction.NOT_LOGGED_IN
        : isProxy
        ? SubmissionRestriction.PROXY_USER
        : !canDrop
        ? SubmissionRestriction.NO_PERMISSION
        : maxDropsCount !== null && identityDropsCount !== null && identityDropsCount >= maxDropsCount
        ? SubmissionRestriction.MAX_DROPS_REACHED
        : submissionStatus !== SubmissionStatus.ACTIVE
        ? submissionStatus === SubmissionStatus.NOT_STARTED
          ? SubmissionRestriction.NOT_STARTED
          : SubmissionRestriction.ENDED
        : null,
      chatRestriction: !isLoggedIn
        ? ChatRestriction.NOT_LOGGED_IN
        : isProxy
        ? ChatRestriction.PROXY_USER
        : !canChat
        ? ChatRestriction.NO_PERMISSION
        : chatDisabled
        ? ChatRestriction.DISABLED
        : null,
    };
  }, [
    isLoggedIn,
    isProxy,
    canChat,
    canDrop,
    chatDisabled,
    submissionStarts,
    submissionEnds,
    maxDropsCount,
    identityDropsCount,
  ]);
}
