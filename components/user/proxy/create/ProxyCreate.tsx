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
  const [step, setStep] = useState<ProxyCreateStep>(ProxyCreateStep.TARGET);

  const components: Record<ProxyCreateStep, JSX.Element> = {
    [ProxyCreateStep.TARGET]: <ProxyCreateTarget />,
    [ProxyCreateStep.ACTION]: <ProxyCreateAction />,
    [ProxyCreateStep.TIME]: <ProxyCreateTime />,
    [ProxyCreateStep.PREVIEW]: <ProxyCreatePreview />,
  };

  return (
    <div>
      <CommonChangeAnimation>{components[step]}</CommonChangeAnimation>
      <div className="tw-mt-6 tw-flex tw-items-center tw-gap-x-3">
        <button
          onClick={() => onModeChange(ProxyMode.LIST)}
          type="button"
          className="tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-800 hover:tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
        <ProxyCreateActionButton activeStep={step} onStepChange={setStep} />
      </div>
    </div>
  );
}
