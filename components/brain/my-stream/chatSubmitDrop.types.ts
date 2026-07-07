import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";

export interface ChatSubmitDropAction {
  readonly isVisible: boolean;
  readonly canOpen: boolean;
  readonly label: string;
  readonly compactLabel: string;
  readonly restrictionMessage: string | null;
  readonly onOpen: () => void;
  readonly onOpenWithCurationUrl: (url: string) => void;
}

export interface ChatSubmitDropState {
  readonly submissionExperience: WaveSubmissionExperience;
  readonly initialCurationUrl: string | null;
}

export const getChatSubmitDropLabels = (
  submissionExperience: WaveSubmissionExperience,
  customButtonLabel: string | null = null
): {
  readonly label: string;
  readonly compactLabel: string;
} => {
  if (customButtonLabel) {
    return {
      label: customButtonLabel,
      compactLabel: customButtonLabel,
    };
  }

  if (submissionExperience === WaveSubmissionExperience.QUORUM_PROPOSAL) {
    return {
      label: "Create Proposal",
      compactLabel: "Create Proposal",
    };
  }

  return {
    label: "Submit drop",
    compactLabel: "Drop",
  };
};
