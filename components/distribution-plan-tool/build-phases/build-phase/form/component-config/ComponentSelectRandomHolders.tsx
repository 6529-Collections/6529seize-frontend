import { useContext, useEffect, useState } from "react";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import {
  PhaseConfigStep,
  RandomHoldersType,
} from "../BuildPhaseFormConfigModal";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import { DistributionPlanToolContext } from "../../../../DistributionPlanToolContext";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import BuildPhaseFormConfigModalSidebar, {
  BuildPhaseFormConfigModalSidebarOption,
} from "./BuildPhaseFormConfigModalSidebar";
import ComponentConfigMeta from "./ComponentConfigMeta";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";

export default function ComponentSelectRandomHolders({
  onNextStep,
  onSelectRandomHolders,
  title,
  uniqueWalletsCount,
  isLoadingUniqueWalletsCount,
  onClose,
}: {
  onNextStep: (step: PhaseConfigStep) => void;
  onSelectRandomHolders: (param: {
    value: number;
    randomHoldersType: RandomHoldersType;
  }) => void;
  title: string;
  uniqueWalletsCount: number | null;
  isLoadingUniqueWalletsCount: boolean;
  onClose: () => void;
}) {
  const { setToasts } = useContext(DistributionPlanToolContext);
  const [value, setValue] = useState<number | string>("");
  const [randomHoldersType, setRandomHoldersType] = useState<RandomHoldersType>(
    RandomHoldersType.BY_COUNT
  );

  const sideBarOptions: BuildPhaseFormConfigModalSidebarOption[] = [
    {
      label: "Randomized by count",
      value: RandomHoldersType.BY_COUNT,
    },
    {
      label: "Randomized by %",
      value: RandomHoldersType.BY_PERCENTAGE,
    },
  ];

  const onRandomHolders = () => {
    if (typeof value !== "number") {
      setToasts({
        messages: ["Please insert value."],
        type: "error",
      });
      return;
    }

    if (value < 1) {
      setToasts({
        messages: ["Value must be greater than 0."],
        type: "error",
      });
      return;
    }

    if (randomHoldersType === RandomHoldersType.BY_PERCENTAGE && value > 100) {
      setToasts({
        messages: ["Value must be less than 100."],
        type: "error",
      });
      return;
    }

    onSelectRandomHolders({
      value,
      randomHoldersType,
    });
  };

  const inputLabels: Record<RandomHoldersType, string> = {
    [RandomHoldersType.BY_COUNT]: "Random holders count",
    [RandomHoldersType.BY_PERCENTAGE]: "Random holders percentage",
  };

  const inputPlaceholders: Record<RandomHoldersType, string> = {
    [RandomHoldersType.BY_COUNT]: "Enter random holders count",
    [RandomHoldersType.BY_PERCENTAGE]: "Enter random holders percentage",
  };

  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof value !== "number") {
      setIsDisabled(true);
      return;
    }

    if (value < 1) {
      setIsDisabled(true);
      return;
    }

    if (randomHoldersType === RandomHoldersType.BY_PERCENTAGE && value > 100) {
      setIsDisabled(true);
      return;
    }

    setIsDisabled(false);
  }, [value, randomHoldersType]);

  const [localUniqueWalletsCount, setLocalUniqueWalletsCount] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (typeof uniqueWalletsCount !== "number") {
      setLocalUniqueWalletsCount(null);
      return;
    }

    if (typeof value !== "number") {
      setLocalUniqueWalletsCount(uniqueWalletsCount);
      return;
    }

    switch (randomHoldersType) {
      case RandomHoldersType.BY_COUNT:
        setLocalUniqueWalletsCount(value);
        break;
      case RandomHoldersType.BY_PERCENTAGE:
        const count = Math.floor((uniqueWalletsCount * value) / 100);
        setLocalUniqueWalletsCount(count);
        break;
      default:
        assertUnreachable(randomHoldersType);
    }
  }, [uniqueWalletsCount, value, randomHoldersType]);

  return (
    <div>
      <div className="tw-w-full tw-inline-flex tw-gap-x-8">
        <BuildPhaseFormConfigModalSidebar
          label="Random type"
          options={sideBarOptions}
          selectedOption={randomHoldersType}
          setSelectedOption={(type) =>
            setRandomHoldersType(type as RandomHoldersType)
          }
        />
        <div className="tw-w-full">
          <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
          <DistributionPlanSecondaryText>
            Do you want to select random holders?
          </DistributionPlanSecondaryText>

          <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-y-4">
            <div className="tw-flex tw-items-center">
              {/* Enabled: "tw-bg-primary-500", Not Enabled: "tw-bg-neutral-700"  */}
              <button
                type="button"
                className="tw-p-0 tw-bg-neutral-700 tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
                role="switch"
                aria-checked="false"
                aria-labelledby="annual-billing-label"
              >
                {/*  Enabled: "tw-translate-x-5", Not Enabled: "tw-translate-x-0"  */}
                <span
                  aria-hidden="true"
                  className="tw-translate-x-0 tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out"
                ></span>
              </button>
              <span className="tw-ml-3 tw-text-sm" id="annual-billing-label">
                <span className="tw-font-medium tw-text-gray-100">
                  Weighted
                </span>
              </span>
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white ">
                {inputLabels[randomHoldersType]}
              </label>
              <div className="tw-mt-1.5">
                <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-1 focus-within:tw-ring-inset focus-within:tw-ring-primary-400">
                  <input
                    type="number"
                    value={value}
                    onChange={(event) =>
                      event.target.value
                        ? setValue(Number(event.target.value))
                        : setValue("")
                    }
                    className="tw-form-input tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                    placeholder={inputPlaceholders[randomHoldersType]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ComponentConfigNextBtn
        showSkipBtn={true}
        showNextBtn={!isDisabled}
        onSkip={() => onNextStep(PhaseConfigStep.COMPONENT_ADD_SPOTS)}
        onNext={onRandomHolders}
        isDisabled={isDisabled}
      >
        <ComponentConfigMeta
          tags={[]}
          walletsCount={localUniqueWalletsCount}
          isLoading={isLoadingUniqueWalletsCount}
        />
      </ComponentConfigNextBtn>
    </div>
  );
}
