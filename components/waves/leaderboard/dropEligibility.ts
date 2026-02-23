import { SubmissionStatus } from "@/hooks/useWave";

interface LeaderboardParticipation {
  readonly isEligible?: boolean | undefined;
  readonly hasReachedLimit?: boolean | undefined;
  readonly status?: SubmissionStatus | undefined;
  readonly canSubmitNow?: boolean | undefined;
}

interface WaveDropEligibilityInput {
  readonly isLoggedIn: boolean;
  readonly isProxy: boolean;
  readonly isCurationWave: boolean;
  readonly participation: LeaderboardParticipation | null | undefined;
}

interface WaveDropEligibility {
  readonly canCreateDrop: boolean;
  readonly restrictionMessage: string | null;
  readonly restrictionLink: {
    readonly href: string;
    readonly label: string;
  } | null;
}

const NETWORK_LEVELS_URL = "https://6529.io/network/levels";

export const getWaveDropEligibility = ({
  isLoggedIn,
  isProxy,
  isCurationWave,
  participation,
}: WaveDropEligibilityInput): WaveDropEligibility => {
  if (!isLoggedIn) {
    return {
      canCreateDrop: false,
      restrictionMessage: "Please log in to make submissions",
      restrictionLink: null,
    };
  }

  if (isProxy) {
    return {
      canCreateDrop: false,
      restrictionMessage: "Proxy users cannot make submissions",
      restrictionLink: null,
    };
  }

  const isEligible = participation?.isEligible ?? false;

  if (!isEligible) {
    if (isCurationWave) {
      return {
        canCreateDrop: false,
        restrictionMessage:
          "Curation wave submissions require at least Level 10.",
        restrictionLink: {
          href: NETWORK_LEVELS_URL,
          label: "Learn more about Network Levels",
        },
      };
    }

    return {
      canCreateDrop: false,
      restrictionMessage: "You don't have permission to submit in this wave",
      restrictionLink: null,
    };
  }

  if (participation?.hasReachedLimit) {
    return {
      canCreateDrop: false,
      restrictionMessage:
        "You have reached the maximum number of drops allowed",
      restrictionLink: null,
    };
  }

  if (participation?.status === SubmissionStatus.NOT_STARTED) {
    return {
      canCreateDrop: false,
      restrictionMessage: "Submissions haven't started yet",
      restrictionLink: null,
    };
  }

  if (participation?.status === SubmissionStatus.ENDED) {
    return {
      canCreateDrop: false,
      restrictionMessage: "Submission period has ended",
      restrictionLink: null,
    };
  }

  const canSubmitNow = participation?.canSubmitNow ?? isEligible;

  if (!canSubmitNow) {
    return {
      canCreateDrop: false,
      restrictionMessage: "You cannot submit in this wave right now",
      restrictionLink: null,
    };
  }

  return {
    canCreateDrop: true,
    restrictionMessage: null,
    restrictionLink: null,
  };
};
