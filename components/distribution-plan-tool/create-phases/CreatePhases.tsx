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
      {phases.length > 0 &&
        phases.map((phase: CreatePhasesPhase) => (
          <div key={phase.id}>{phase.name}</div>
        ))}
      <div className="tw-mt-5">
        <form onSubmit={handleSubmit} className="tw-px-4 tw-sm:px-6">
          <div>
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
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-mt-6">
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
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>

          <div className="tw-mt-8 tw-w-full">
            <button
              type="submit"
              className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-base tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Add Phase
            </button>
          </div>
        </form>
        <div className="tw-mt-8 tw-w-full">
          <button
            onClick={() => setStep(DistributionPlanToolStep.BUILD_PHASES)}
            className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-base tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Build Phases
          </button>
        </div>
      </div>
    </div>
  );
}
