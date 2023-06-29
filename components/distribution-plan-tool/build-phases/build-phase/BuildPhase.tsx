import { useContext, useEffect, useState } from "react";
import { BuildPhasesPhase } from "../BuildPhases";

import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  Pool,
} from "../../../allowlist-tool/allowlist-tool.types";

import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import AllowlistToolSelectMenuMultiple, {
  AllowlistToolSelectMenuMultipleOption,
} from "../../../allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";

export default function BuildPhase({
  phase,
  onNextStep,
}: {
  phase: BuildPhasesPhase;
  onNextStep: () => void;
}) {
  const {
    operations,
    distributionPlan,
    addOperations,
    setToasts,
    runOperations,
  } = useContext(DistributionPlanToolContext);

  const [haveRan, setHaveRan] = useState(false);

  useEffect(() => {
    setHaveRan(!phase.components.some((component) => component.spotsNotRan));
  }, [phase]);

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
      setSelectedSnapshots([...selectedSnapshots, option]);
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
  };

  return (
    <>
      <div className="tw-flex tw-flex-col">
        <h1 className="tw-uppercase tw-text-white">{phase.name}</h1>
        <p className="tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
          Here you can select which groups of collectors belong in phase 1.
        </p>
      </div>

      <div className="tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700 tw-mx-auto">
        <form
          onSubmit={handleSubmit}
          className="tw-flex tw-items-end tw-gap-x-4"
        >
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
            <button
              type="submit"
              className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
            >
              Add group
            </button>
          </div>
        </form>

        <div className="tw-mt-8 tw-flow-root">
          <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
            <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8">
              <div className="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-neutral-700 tw-rounded-lg">
                <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700">
                  <thead className="tw-bg-neutral-800/50">
                    <tr>
                      <th
                        scope="col"
                        className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                      >
                        Spots
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tw-bg-neutral-900 tw-divide-y tw-divide-neutral-700/40">
                    {phase.components.map((component) => (
                      <tr key={component.id}>
                        <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
                          {component.name}
                        </td>
                        <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
                          {component.description}
                        </td>
                        <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
                          {component.spotsNotRan ? "N/A" : component.spots}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="tw-mt-8 tw-flex tw-justify-end tw-space-x-4">
          {!haveRan && (
            <button
              onClick={runOperations}
              type="button"
              className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
            >
              Run analysis
            </button>
          )}

          {haveRan && (
            <button
              onClick={onNextStep}
              className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}
