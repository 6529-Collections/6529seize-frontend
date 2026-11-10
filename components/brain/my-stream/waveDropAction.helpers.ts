import type { HeaderWaveDropAction } from "@/contexts/HeaderContext";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { MEMES_NOMINEE_REQUIRED_REP } from "@/helpers/waves/memes-nomination";
import { SubmissionStatus } from "@/hooks/useWave";
import type { getWaveDropEligibility } from "@/components/waves/leaderboard/dropEligibility";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  withDisplayTimeZone,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

// The fields `Date#toLocaleString()` prints by default, spelled out so the
// display time zone can be added without changing the device-zone output.
const SUBMISSION_WINDOW_TIME_FORMAT = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
} satisfies Intl.DateTimeFormatOptions;

/**
 * A submission window boundary for tooltips, in the display time zone. In the
 * device zone it matches `new Date(value).toLocaleString()`; elsewhere it
 * names its zone, such as "11/9/2026, 5:06:07 PM UTC".
 */
export const formatSubmissionWindowTime = (
  value: number,
  zone: DisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE
): string =>
  new Date(value).toLocaleString(
    undefined,
    withDisplayTimeZone(zone, SUBMISSION_WINDOW_TIME_FORMAT)
  );

export const getChatSubmitDropRestrictionMessage = ({
  dropEligibility,
  isApprovalVotingControlsLocked,
}: {
  readonly dropEligibility: ReturnType<typeof getWaveDropEligibility>;
  readonly isApprovalVotingControlsLocked: boolean;
}): string | null => {
  if (!dropEligibility.canCreateDrop) {
    return dropEligibility.restrictionMessage;
  }

  if (isApprovalVotingControlsLocked) {
    return "Approval controls are locked";
  }

  return null;
};

type MemesHeaderDropActionState = Pick<
  HeaderWaveDropAction,
  | "canOpen"
  | "label"
  | "compactLabel"
  | "restrictionMessage"
  | "restrictionKind"
>;

interface MemesHeaderParticipationState {
  readonly canSubmitNow: boolean;
  readonly endTime: number;
  readonly hasReachedLimit: boolean;
  readonly isEligible: boolean;
  readonly maxSubmissions: number | null;
  readonly startTime: number;
  readonly status: SubmissionStatus;
}

const getMemesSubmissionPeriodHeaderDropActionState = (
  {
    endTime,
    startTime,
    status,
  }: Pick<MemesHeaderParticipationState, "endTime" | "startTime" | "status">,
  zone: DisplayTimeZone
): MemesHeaderDropActionState | null => {
  if (status === SubmissionStatus.ENDED) {
    const closingTime = endTime
      ? formatSubmissionWindowTime(endTime, zone)
      : null;

    return {
      canOpen: false,
      label: "Submissions Closed",
      compactLabel: "Closed",
      restrictionMessage: closingTime
        ? `Submissions closed on ${closingTime}`
        : "Submissions are closed",
    };
  }

  if (status === SubmissionStatus.NOT_STARTED) {
    const openingTime = startTime
      ? formatSubmissionWindowTime(startTime, zone)
      : null;

    return {
      canOpen: false,
      label: "Submissions Open Soon",
      compactLabel: "Opens",
      restrictionMessage: openingTime
        ? `Submissions open on ${openingTime}`
        : "Submissions will open soon",
    };
  }

  return null;
};

export const getMemesHeaderDropActionState = ({
  participationState,
  isApprovalVotingControlsLocked,
  zone = LOCAL_DISPLAY_TIME_ZONE,
}: {
  readonly participationState: MemesHeaderParticipationState;
  readonly isApprovalVotingControlsLocked: boolean;
  /** The zone for submission window times; defaults to the device zone. */
  readonly zone?: DisplayTimeZone | undefined;
}): MemesHeaderDropActionState => {
  if (isApprovalVotingControlsLocked) {
    return {
      canOpen: false,
      label: "Submit Work to The Memes",
      compactLabel: "Submit",
      restrictionMessage: "Approval controls are locked",
    };
  }

  const periodActionState = getMemesSubmissionPeriodHeaderDropActionState(
    participationState,
    zone
  );
  if (periodActionState) {
    return periodActionState;
  }

  if (!participationState.isEligible) {
    return {
      canOpen: false,
      label: "How to Submit",
      compactLabel: "Submit",
      restrictionMessage: `Reach ${formatNumberWithCommas(MEMES_NOMINEE_REQUIRED_REP)} MemesNominee REP to become eligible to submit work.`,
      restrictionKind: "memes-nomination",
    };
  }

  if (participationState.hasReachedLimit) {
    const maxSubmissions = participationState.maxSubmissions ?? "?";
    const submissionText =
      maxSubmissions === 1 ? "1 submission" : `${maxSubmissions} submissions`;

    return {
      canOpen: false,
      label: "Submission Limit Reached",
      compactLabel: "Limit",
      restrictionMessage: `You have already submitted the maximum allowed (${submissionText})`,
    };
  }

  if (!participationState.canSubmitNow) {
    return {
      canOpen: false,
      label: "Submit Work to The Memes",
      compactLabel: "Submit",
      restrictionMessage: "You cannot submit at this time",
    };
  }

  return {
    canOpen: true,
    label: "Submit Work to The Memes",
    compactLabel: "Submit",
    restrictionMessage: null,
  };
};
