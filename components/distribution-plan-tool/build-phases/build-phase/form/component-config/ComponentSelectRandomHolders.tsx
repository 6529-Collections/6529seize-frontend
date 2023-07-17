import { useContext, useState } from "react";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import { DistributionPlanToolContext } from "../../../../DistributionPlanToolContext";

export default function ComponentSelectRandomHolders({
  onNextStep,
  onSelectRandomHolders,
}: {
  onNextStep: (step: PhaseConfigStep) => void;
  onSelectRandomHolders: (count: number) => void;
}) {
  const { setToasts } = useContext(DistributionPlanToolContext);

  const [count, setCount] = useState<number | string>("");

  const onRandomHolders = () => {
    if (typeof count !== "number") {
      setToasts({
        messages: ["Please insert a count value."],
        type: "error",
      });
      return;
    }

    if (count < 1) {
      setToasts({
        messages: ["Count value must be greater than 0."],
        type: "error",
      });
      return;
    }

    onSelectRandomHolders(count);
  };

  return (
    <div>
      <DistributionPlanSecondaryText>
        Do you want to select random holders?
      </DistributionPlanSecondaryText>
      <fieldset className="tw-mt-6">
        <div className="tw-space-y-4 sm:tw-flex sm:tw-items-center sm:tw-space-x-10 sm:tw-space-y-0">
          <div className="tw-flex tw-items-center">
            <input
              type="radio"
              checked
              className="tw-h-4 tw-w-4 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
            />
            <label className="tw-ml-3 tw-block tw-text-sm tw-font-normal tw-leading-6 tw-text-neutral-200">
              Randomized count
            </label>
          </div>
          <div className="tw-flex tw-items-center">
            <input
              type="radio"
              className="tw-h-4 tw-w-4 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
            />
            <label className="tw-ml-3 tw-block tw-text-sm tw-font-normal tw-leading-6 tw-text-neutral-200">
              Randomized % count
            </label>
          </div>
        </div>
      </fieldset>
      <div className="tw-mt-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white ">
          Count
        </label>
        <div className="tw-mt-1.5">
          <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
            <input
              type="number"
              value={count}
              onChange={(event) =>
                event.target.value
                  ? setCount(Number(event.target.value))
                  : setCount("")
              }
              className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
              placeholder="Random holders count"
            />
          </div>
        </div>
      </div>

      <ComponentConfigNextBtn
        showSkip={true}
        onSkip={() => onNextStep(PhaseConfigStep.COMPONENT_ADD_SPOTS)}
        onNext={onRandomHolders}
      />
    </div>
  );
}
