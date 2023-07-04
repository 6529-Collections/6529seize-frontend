import { useContext, useEffect, useState } from "react";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  Pool,
} from "../../../../allowlist-tool/allowlist-tool.types";
import AllowlistToolSelectMenuMultiple, {
  AllowlistToolSelectMenuMultipleOption,
} from "../../../../allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple";
import { DistributionPlanToolContext } from "../../../DistributionPlanToolContext";
import { BuildPhasesPhase } from "../../BuildPhases";
import DistributionPlanAddOperationBtn from "../../../common/DistributionPlanAddOperationBtn";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import BuildPhaseFormConfigModal from "./BuildPhaseFormConfigModal";

export default function BuildPhaseForm({ phase }: { phase: BuildPhasesPhase }) {
  const { operations, distributionPlan, addOperations, setToasts } = useContext(
    DistributionPlanToolContext
  );

  const [snapshots, setSnapshots] = useState<
    AllowlistToolSelectMenuMultipleOption[]
  >([]);

  useEffect(() => {
    const tokenPools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL
      )
      .map((operation) => ({
        value: operation.params.id,
        title: operation.params.name,
        subTitle: "Snapshot",
      }));

    const customTokenPools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
      )
      .map((operation) => ({
        value: operation.params.id,
        title: operation.params.name,
        subTitle: "Custom Snapshot",
      }));

    setSnapshots([...tokenPools, ...customTokenPools]);
  }, [operations]);

  const [selectedSnapshots, setSelectedSnapshots] = useState<
    AllowlistToolSelectMenuMultipleOption[]
  >([]);

  const toggleSelectedOption = (
    option: AllowlistToolSelectMenuMultipleOption
  ) => {
    const isSelected = selectedSnapshots.find(
      (selectedOption) => selectedOption.value === option.value
    );
    if (isSelected) {
      setSelectedSnapshots(
        selectedSnapshots.filter(
          (selectedOption) => selectedOption.value !== option.value
        )
      );
    } else {
      setSelectedSnapshots((prev) => [...prev, option]);
    }
  };

  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
    mintCap: string;
  }>({
    name: "",
    description: "",
    mintCap: "",
  });
  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const [isLoading, setIsLoading] = useState(false);

  const addOperation = async ({
    code,
    params,
  }: {
    code: AllowlistOperationCode;
    params: any;
  }): Promise<string | null> => {
    if (!distributionPlan) return null;
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/operations`;
    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          params,
        }),
      });
      const data: AllowlistToolResponse<AllowlistOperation> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return null;
      }
      addOperations([data]);
      return data.params.id;
    } catch (error) {
      setToasts({
        messages: ["Something went wrong. Please try again."],
        type: "error",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addComponent = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    return await addOperation({
      code: AllowlistOperationCode.ADD_COMPONENT,
      params: {
        id: getRandomObjectId(),
        name: formValues.name,
        description: formValues.description,
        phaseId: phase.id,
      },
    });
  };

  const addItem = async ({
    componentId,
    snapshot,
  }: {
    componentId: string;
    snapshot: AllowlistToolSelectMenuMultipleOption;
  }): Promise<string | null> => {
    if (!distributionPlan) return null;
    return await addOperation({
      code: AllowlistOperationCode.ADD_ITEM,
      params: {
        id: getRandomObjectId(),
        name: snapshot.title,
        description: snapshot.subTitle,
        componentId,
        poolId: snapshot.value,
        poolType:
          snapshot.subTitle === "Snapshot"
            ? Pool.TOKEN_POOL
            : Pool.CUSTOM_TOKEN_POOL,
      },
    });
  };
  const addSpots = async ({
    componentId,
    spots,
  }: {
    componentId: string;
    spots: number;
  }): Promise<void> => {
    if (!distributionPlan) return;
    await addOperation({
      code: AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS,
      params: {
        componentId,
        spots,
      },
    });
  };

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!distributionPlan) return;
    if (!selectedSnapshots.length) {
      setToasts({
        messages: ["Please select at least one snapshot."],
        type: "error",
      });
      return;
    }
    if (
      !formValues.mintCap ||
      isNaN(+formValues.mintCap) ||
      +formValues.mintCap < 1
    ) {
      setToasts({
        messages: ["Please enter a valid maximum mints."],
        type: "error",
      });
      return;
    }
    //  setIsConfigModalOpen(true);
    const componentId = await addComponent();
    if (!componentId) return;
    for (const snapshot of selectedSnapshots) {
      const itemId = await addItem({ componentId, snapshot });
      if (!itemId) return;
    }
    await addSpots({ componentId, spots: +formValues.mintCap });
    setFormValues({
      name: "",
      description: "",
      mintCap: "",
    });
    setSelectedSnapshots([]);
  };
  return (
    <form onSubmit={handleSubmit} className="tw-flex tw-items-end tw-gap-x-4">
      <div className="tw-flex-1">
        <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
          Name
        </label>
        <div className="tw-mt-2">
          <input
            type="text"
            name="name"
            value={formValues.name}
            onChange={handleFormChange}
            required
            autoComplete="off"
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
      <div className="tw-flex-1">
        <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
          Description
        </label>
        <div className="tw-mt-2">
          <input
            type="text"
            name="description"
            required
            value={formValues.description}
            onChange={handleFormChange}
            autoComplete="off"
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
      <div className="tw-flex-1">
        <AllowlistToolSelectMenuMultiple
          label="Select snapshots"
          placeholder="Select"
          options={snapshots}
          selectedOptions={selectedSnapshots}
          toggleSelectedOption={toggleSelectedOption}
        />
      </div>
      <div className="tw-flex-1">
        <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
          Maximum mints
        </label>
        <div className="tw-mt-2">
          <input
            type="number"
            name="mintCap"
            value={formValues.mintCap}
            onChange={handleFormChange}
            required
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>

      <div>
        <DistributionPlanAddOperationBtn loading={isLoading}>
          Add group
        </DistributionPlanAddOperationBtn>
      </div>
      <AllowlistToolCommonModalWrapper
        showModal={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure group"
        modalSize={AllowlistToolModalSize.LARGE}
      >
        <BuildPhaseFormConfigModal />
      </AllowlistToolCommonModalWrapper>
    </form>
  );
}
