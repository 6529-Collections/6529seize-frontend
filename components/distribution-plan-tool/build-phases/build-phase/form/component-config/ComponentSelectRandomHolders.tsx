"use client";

import DistributionPlanSecondaryText from "@/components/distribution-plan-tool/common/DistributionPlanSecondaryText";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { useContext, useEffect, useState } from "react";
import {
    PhaseConfigStep,
    RandomHoldersType,
} from "../BuildPhaseFormConfigModal";
import BuildPhaseFormConfigModalSidebar, {
    BuildPhaseFormConfigModalSidebarOption,
} from "./BuildPhaseFormConfigModalSidebar";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import ComponentConfigMeta from "./ComponentConfigMeta";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import ComponentRandomHoldersWeight, {
    ComponentRandomHoldersWeightType,
} from "./utils/ComponentRandomHoldersWeight";

export default function ComponentSelectRandomHolders({
  onNextStep,
  onSelectRandomHolders,
  title,
  uniqueWalletsCount = null,
  isLoadingUniqueWalletsCount = false,
  onClose,
}: Readonly<{
  onNextStep: (step: PhaseConfigStep) => void;
  onSelectRandomHolders: (param: {
    value: number;
    randomHoldersType: RandomHoldersType;
    weightType: ComponentRandomHoldersWeightType;
    seed: string;
  }) => void;
  title: string;
  uniqueWalletsCount?: number | null;
  isLoadingUniqueWalletsCount?: boolean;
  onClose: () => void;
}>) {
  const { setToasts, distributionPlan } = useContext(
    DistributionPlanToolContext
  );
  const [value, setValue] = useState<number | string>("");
  const [seed, setSeed] = useState<string>(distributionPlan?.id ?? "");
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

  const [weightType, setWeightType] =
    useState<ComponentRandomHoldersWeightType>(
      ComponentRandomHoldersWeightType.OFF
    );

  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    if (typeof value !== "number") {
      setIsError(false);
      return;
    }

    if (value < 1) {
      setIsError(true);
      return;
    }

    if (randomHoldersType === RandomHoldersType.BY_PERCENTAGE && value > 100) {
      setIsError(true);
      return;
    }

    if (
      randomHoldersType === RandomHoldersType.BY_COUNT &&
      typeof uniqueWalletsCount === "number" &&
      value > uniqueWalletsCount
    ) {
      setIsError(true);
      return;
    }

    setIsError(false);
  }, [value, randomHoldersType, uniqueWalletsCount]);

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

    if (!seed.length) {
      setToasts({
        messages: ["Please insert seed."],
        type: "error",
      });
      return;
    }

    onSelectRandomHolders({
      value,
      randomHoldersType,
      weightType,
      seed,
    });
  };

  const inputLabels: Record<RandomHoldersType, string> = {
    [RandomHoldersType.BY_COUNT]: "Random holders count (#)",
    [RandomHoldersType.BY_PERCENTAGE]: "Random holders percentage (%)",
  };

  const inputPlaceholders: Record<RandomHoldersType, string> = {
    [RandomHoldersType.BY_COUNT]: "Example: 100",
    [RandomHoldersType.BY_PERCENTAGE]: "Example: 10",
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

    if (!seed.length) {
      setIsDisabled(true);
      return;
    }

    setIsDisabled(false);
  }, [value, randomHoldersType, seed]);

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
      <div className="tw-flex">
        <BuildPhaseFormConfigModalSidebar
          label="Random type"
          options={sideBarOptions}
          selectedOption={randomHoldersType}
          setSelectedOption={(type) =>
            setRandomHoldersType(type as RandomHoldersType)
          }
        />
        <div className="tw-w-full tw-p-6">
          <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
          <DistributionPlanSecondaryText>
            Do you want to select random holders?
          </DistributionPlanSecondaryText>

          <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-y-4">
            <ComponentRandomHoldersWeight
              selected={weightType}
              onChange={setWeightType}
            />
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
                {inputLabels[randomHoldersType]}
              </label>
              <div className="tw-mt-1.5">
                <div
                  className={`
                tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset focus-within:tw-ring-1 focus-within:tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
                  isError
                    ? "tw-ring-error focus-within:tw-ring-error"
                    : "tw-ring-iron-700/40 focus-within:tw-ring-primary-400 hover:tw-ring-iron-700"
                }`}>
                  <input
                    type="number"
                    value={value}
                    onChange={(event) =>
                      event.target.value
                        ? setValue(Number(event.target.value))
                        : setValue("")
                    }
                    className="tw-form-input tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-iron-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                    placeholder={inputPlaceholders[randomHoldersType]}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
                Random seed
              </label>
              <div className="tw-mt-1.5">
                <div
                  className={`
                tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset focus-within:tw-ring-1 focus-within:tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
                  !seed.length
                    ? "tw-ring-error focus-within:tw-ring-error"
                    : "tw-ring-iron-700/40 focus-within:tw-ring-primary-400 hover:tw-ring-iron-700"
                }`}>
                  <input
                    type="text"
                    value={seed}
                    onChange={(event) => setSeed(event.target.value)}
                    placeholder="Random seed"
                    className="tw-form-input tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-iron-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
          <ComponentConfigNextBtn
            showSkipBtn={true}
            showNextBtn={!isDisabled}
            onSkip={() => onNextStep(PhaseConfigStep.COMPONENT_ADD_SPOTS)}
            onNext={onRandomHolders}
            isDisabled={isDisabled}>
            <ComponentConfigMeta
              tags={[]}
              walletsCount={localUniqueWalletsCount}
              isLoading={isLoadingUniqueWalletsCount}
            />
          </ComponentConfigNextBtn>
        </div>
      </div>
    </div>
  );
}
