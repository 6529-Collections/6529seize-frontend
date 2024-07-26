import { CreateWaveStepStatus } from "../../types/waves.types";

export const getCreateWaveStepStatus = ({
  stepIndex,
  activeStepIndex,
}: {
  readonly stepIndex: number;
  readonly activeStepIndex: number;
}): CreateWaveStepStatus => {
  if (stepIndex < activeStepIndex) {
    return CreateWaveStepStatus.DONE;
  }
  if (stepIndex === activeStepIndex) {
    return CreateWaveStepStatus.ACTIVE;
  }
  return CreateWaveStepStatus.PENDING;
};
