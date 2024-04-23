import { useState } from "react";
import { ProxyMode } from "../UserPageProxy";
import ProxyCreateTarget from "./steps/target/ProxyCreateTarget";
import ProxyCreateAction from "./steps/action/ProxyCreateAction";
import ProxyCreateTime from "./steps/ProxyCreateTime";
import ProxyCreatePreview from "./steps/ProxyCreatePreview";
import ProxyCreateActionButton from "./ProxyCreateActionButton";
import CommonChangeAnimation from "../../../utils/animation/CommonChangeAnimation";

export enum ProxyCreateStep {
  TARGET = "TARGET",
  ACTION = "ACTION",
  TIME = "TIME",
  PREVIEW = "PREVIEW",
}

export default function ProxyCreate({
  onModeChange,
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
}) {
  const [step, setStep] = useState<ProxyCreateStep>(ProxyCreateStep.ACTION);

  const components: Record<ProxyCreateStep, JSX.Element> = {
    [ProxyCreateStep.TARGET]: <ProxyCreateTarget />,
    [ProxyCreateStep.ACTION]: <ProxyCreateAction />,
    [ProxyCreateStep.TIME]: <ProxyCreateTime />,
    [ProxyCreateStep.PREVIEW]: <ProxyCreatePreview />,
  };

  return (
    <div>
      <button onClick={() => onModeChange(ProxyMode.LIST)}>CANCEL</button>
      <div className="tw-my-4">
        <CommonChangeAnimation>{components[step]}</CommonChangeAnimation>
      </div>
      <ProxyCreateActionButton activeStep={step} onStepChange={setStep} />
    </div>
  );
}
