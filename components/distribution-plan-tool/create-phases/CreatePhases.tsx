import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../allowlist-tool/allowlist-tool.types";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";
import CreatePhasesTable from "./table/CreatePhasesTable";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import StepHeader from "../common/StepHeader";
import CreatePhasesForm from "./form/CreatePhasesForm";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";

export default function CreatePhases() {
  const { setStep } = useContext(DistributionPlanToolContext);
  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_PHASES} />
      <DistributionPlanStepWrapper>
        <CreatePhasesForm />
        <div className="tw-mt-6">
          <CreatePhasesTable />
        </div>
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={false}
          onNextStep={() => setStep(DistributionPlanToolStep.BUILD_PHASES)}
          loading={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
