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
import {
  AllowlistOperationBase,
  AllowlistToolResponse,
} from "../../../../../allowlist-tool/allowlist-tool.types";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";

export default function ComponentSelectRandomHolders({
  onNextStep,
  onSelectRandomHolders,
  title,
  uniqueWalletsCountRequestOperations,
  onClose,
}: {
  onNextStep: (step: PhaseConfigStep) => void;
  onSelectRandomHolders: (param: {
    value: number;
    randomHoldersType: RandomHoldersType;
  }) => void;
  title: string;
  uniqueWalletsCountRequestOperations: AllowlistOperationBase[];
  onClose: () => void;
}) {
  const { setToasts, distributionPlan } = useContext(
    DistributionPlanToolContext
  );
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

  const [uniqueWalletsCount, setUniqueWalletsCount] = useState<number | null>(
    null
  );

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
        setLocalUniqueWalletsCount(uniqueWalletsCount - value);
        break;
      case RandomHoldersType.BY_PERCENTAGE:
        const count = Math.floor((uniqueWalletsCount * value) / 100);
        setLocalUniqueWalletsCount(count);
        break;
      default:
        assertUnreachable(randomHoldersType);
    }
  }, [uniqueWalletsCount, value, randomHoldersType]);

  useEffect(() => {
    const setUniqueWalletsCountByOperations = async (
      distributionPlanId: string
    ) => {
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/unique-wallets-count`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uniqueWalletsCountRequestOperations),
        });
        const data: AllowlistToolResponse<number> = await response.json();
        if (typeof data !== "number" && "error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
          return { success: false };
        }
        setUniqueWalletsCount(data);
        return { success: true };
      } catch (error) {
        setToasts({
          messages: ["Something went wrong. Please try again."],
          type: "error",
        });
        return { success: false };
      }
    };
    if (!uniqueWalletsCountRequestOperations.length || !distributionPlan) {
      setUniqueWalletsCount(null);
      return;
    }

    setUniqueWalletsCountByOperations(distributionPlan.id);
  }, [uniqueWalletsCountRequestOperations, distributionPlan, setToasts]);

  return (
    <div>
      <div className="tw-w-full tw-inline-flex tw-gap-x-8">
        <BuildPhaseFormConfigModalSidebar
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
                    className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
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
        <ComponentConfigMeta tags={[]} walletsCount={localUniqueWalletsCount} />
      </ComponentConfigNextBtn>
    </div>
  );
}
