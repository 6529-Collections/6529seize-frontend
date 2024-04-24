import { ProxyCreateStep } from "./ProxyCreate";

export default function ProxyCreateActionButton({
  activeStep,
  onStepChange,
}: {
  readonly activeStep: ProxyCreateStep;
  readonly onStepChange: (step: ProxyCreateStep) => void;
}) {
  const setNextStep = () => {
    const steps = Object.values(ProxyCreateStep);
    const currentIndex = steps.indexOf(activeStep);
    if (currentIndex === -1) {
      throw new Error("Invalid step");
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex >= steps.length) {
      console.log("submit");
      return;
    }
    onStepChange(steps[nextIndex]);
  };
  return <button type="button" onClick={setNextStep} className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out">Next</button>;
}
