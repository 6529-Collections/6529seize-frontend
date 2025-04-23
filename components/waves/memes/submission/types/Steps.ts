/**
 * Enum for the different steps in the artwork submission flow
 */
export enum SubmissionStep {
  AGREEMENT = 'agreement',
  ARTWORK = 'artwork'
}

/**
 * Maps step numbers to enum values
 */
const stepIndexToEnum = (stepIndex: number): SubmissionStep => {
  switch (stepIndex) {
    case 0:
      return SubmissionStep.AGREEMENT;
    case 1:
      return SubmissionStep.ARTWORK;
    default:
      return SubmissionStep.AGREEMENT;
  }
};

/**
 * Maps enum values to step numbers
 */
const stepEnumToIndex = (step: SubmissionStep): number => {
  switch (step) {
    case SubmissionStep.AGREEMENT:
      return 0;
    case SubmissionStep.ARTWORK:
      return 1;
    default:
      return 0;
  }
};