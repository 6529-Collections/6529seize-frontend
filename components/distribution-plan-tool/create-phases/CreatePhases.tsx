import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistPhaseWithComponentAndItems,
  AllowlistToolResponse,
} from "../../allowlist-tool/allowlist-tool.types";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";

interface CreatePhasesPhase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly hasRan: boolean;
}

export default function CreatePhases() {
  const { operations, setToasts, distributionPlan, addOperations, setStep } =
    useContext(DistributionPlanToolContext);
  const [phases, setPhases] = useState<CreatePhasesPhase[]>([]);

  useEffect(() => {
    const createPhasesOperations = operations.filter(
      (operation) => operation.code === AllowlistOperationCode.ADD_PHASE
    );
    setPhases(
      createPhasesOperations.map((operation) => ({
        id: operation.params.id,
        name: operation.params.name,
        description: operation.params.description,
        hasRan: operation.hasRan,
      }))
    );
  }, [operations]);

  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };
  const [isLoading, setIsLoading] = useState(false);

  const addPhase = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/operations`;
    try {
      const phaseId = getRandomObjectId();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: AllowlistOperationCode.ADD_PHASE,
          params: {
            id: phaseId,
            name: formValues.name,
            description: formValues.description,
          },
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
      setFormValues({
        name: "",
        description: "",
      });
      return phaseId;
    } catch (error) {
      setToasts({
        messages: ["Something went wrong. Please try again later."],
        type: "error",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await addPhase();
  };

  return (
    <div>
      <div className="tw-max-w-2xl tw-flex tw-flex-col">
        <h1 className="tw-uppercase tw-text-white">Create Phases</h1>
        <p className="tw-mb-0 tw-mt-1 tw-block tw-font-light tw-text-base tw-text-neutral-400">
          Many artist like to have multiple phases for their drop. A common
          2-phase pattern is to have an allowlist phase and a public mint phase.
          A more complicated 4-phase pattern is: airdrop, allowlist , allowlist
          2, public mint. Use this page to create your phases. We will define
          the phases in the next steps.
        </p>
      </div>
      <div className="tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700 tw-mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="tw-flex tw-gap-x-4 tw-items-end">
            <div className="tw-flex-1">
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                Name
              </label>
              <div className="tw-mt-2">
                <input
                  type="text"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  placeholder="Name of Distribution Plan"
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
                  value={formValues.description}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  placeholder="Short description about Distribution Plan"
                  className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
              >
                Add Phase
              </button>
            </div>
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
                        className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left 
                        tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase 
                        tw-tracking-[0.25px]"
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tw-bg-neutral-900 tw-divide-y tw-divide-neutral-700/40">
                    {phases.map((phase) => (
                      <tr key={phase.id}>
                        <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
                          {phase.name}
                        </td>
                        <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
                          {phase.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="tw-mt-8 tw-flex tw-justify-end">
          <button
            onClick={() => setStep(DistributionPlanToolStep.BUILD_PHASES)}
            className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
