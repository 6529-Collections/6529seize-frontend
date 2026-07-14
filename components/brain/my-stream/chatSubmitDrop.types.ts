import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

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
    const proposalLabel = t(
      DEFAULT_LOCALE,
      "waves.submissionButtonLabel.defaultCreateProposal"
    );

    return {
      label: proposalLabel,
      compactLabel: proposalLabel,
    };
  }

  return {
    label: t(DEFAULT_LOCALE, "waves.submissionButtonLabel.defaultSubmitDrop"),
    compactLabel: t(DEFAULT_LOCALE, "waves.submissionButtonLabel.defaultDrop"),
  };
};
