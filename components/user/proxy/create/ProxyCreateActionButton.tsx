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
  return <button onClick={setNextStep}>NEXT</button>;
}
