import { useContext, useState } from "react";
import { DistributionPlanToolContext } from "../../../DistributionPlanToolContext";
import { BuildPhasesPhase } from "../../BuildPhases";
import DistributionPlanAddOperationBtn from "../../../common/DistributionPlanAddOperationBtn";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import BuildPhaseFormConfigModal from "./BuildPhaseFormConfigModal";

export default function BuildPhaseForm({
  selectedPhase,
  phases,
}: {
  selectedPhase: BuildPhasesPhase;
  phases: BuildPhasesPhase[];
}) {
  const { distributionPlan } = useContext(DistributionPlanToolContext);

  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!distributionPlan) return;
    setIsConfigModalOpen(true);
  };

  const handleConfigModalClose = () => {
    setFormValues({
      name: "",
      description: "",
    });
    setIsConfigModalOpen(false);
  };
  return (
    <>
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
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-500 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-500 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div>
          <DistributionPlanAddOperationBtn loading={false}>
            Configure group
          </DistributionPlanAddOperationBtn>
        </div>
      </form>
      <AllowlistToolCommonModalWrapper
        showModal={isConfigModalOpen}
        onClose={handleConfigModalClose}
        title={`Configure group "${formValues.name}"`}
        modalSize={AllowlistToolModalSize.LARGE}
      >
        <BuildPhaseFormConfigModal
          onClose={handleConfigModalClose}
          name={formValues.name}
          description={formValues.description}
          selectedPhase={selectedPhase}
          phases={phases}
        />
      </AllowlistToolCommonModalWrapper>
    </>
  );
}
