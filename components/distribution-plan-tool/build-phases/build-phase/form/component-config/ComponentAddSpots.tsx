"use client";

import DistributionPlanSecondaryText from "@/components/distribution-plan-tool/common/DistributionPlanSecondaryText";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import ComponentConfigMeta from "./ComponentConfigMeta";

export default function ComponentAddSpots({
  onSelectMaxMintCount,
  title,
  uniqueWalletsCount,
  isLoadingUniqueWalletsCount,
  onClose,
}: {
  onSelectMaxMintCount: (maxMints: number) => void;
  title: string;
  uniqueWalletsCount: number | null;
  isLoadingUniqueWalletsCount: boolean;
  onClose: () => void;
}) {
  const { setToasts } = useContext(DistributionPlanToolContext);

  const [maxMints, setMaxMints] = useState<number | string>("");

  const onAddSpots = () => {
    if (typeof maxMints !== "number") {
      setToasts({
        messages: ["Please insert a max mint count."],
        type: "error",
      });
      return;
    }

    if (typeof maxMints === "number" && maxMints < 1) {
      setToasts({
        messages: ["Max mint count must be greater than 0."],
        type: "error",
      });
      return;
    }
    onSelectMaxMintCount(maxMints);
  };

  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (!maxMints) {
      setIsDisabled(true);
      return;
    }

    if (typeof maxMints !== "number") {
      setIsDisabled(true);
      return;
    }

    if (typeof maxMints === "number" && maxMints < 1) {
      setIsDisabled(true);
      return;
    }

    setIsDisabled(false);
  }, [maxMints]);

  return (
    <div className="tw-p-6">
      <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
      <DistributionPlanSecondaryText>
        What is the maximum number of mints allowed per address?
      </DistributionPlanSecondaryText>
      <div className="tw-mt-6">
        <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
          Count
        </label>
        <div className="tw-mt-1.5">
          <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 hover:tw-ring-neutral-700 focus-within:tw-ring-1 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
            <input
              type="number"
              value={maxMints}
              onChange={(event) =>
                event.target.value
                  ? setMaxMints(Number(event.target.value))
                  : setMaxMints("")
              }
              className="tw-form-input tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
              placeholder="Max mint count per wallet"
            />
          </div>
        </div>
      </div>

      <ComponentConfigNextBtn
        showSkipBtn={false}
        showNextBtn={!isDisabled}
        onSkip={() => undefined}
        onNext={onAddSpots}
        isDisabled={isDisabled}>
        <ComponentConfigMeta
          tags={[]}
          walletsCount={uniqueWalletsCount}
          isLoading={isLoadingUniqueWalletsCount}
        />
      </ComponentConfigNextBtn>
    </div>
  );
}
