import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
import StepHeader from "../common/StepHeader";
import MapDelegationsForm from "./MapDelegationsForm";
import { AllowlistOperationCode } from "../../allowlist-tool/allowlist-tool.types";
import MapDelegationsDone from "./MapDelegationsDone";

export default function MapDelegations() {
  const { operations, setStep } = useContext(DistributionPlanToolContext);
  const [delegationContract, setDelegationContract] = useState<string | null>();

  useEffect(() => {
    setDelegationContract(
      operations.find(
        (o) =>
          o.code === AllowlistOperationCode.MAP_RESULTS_TO_DELEGATED_WALLETS
      )?.params?.delegationContract ?? null
    );
  }, [operations]);

  const [haveUnRunOperations, setHaveUnRunOperations] = useState(false);

  useEffect(() => {
    setHaveUnRunOperations(operations.some((o) => !o.hasRan));
  }, [operations]);

  const [showRunAnalysisBtn, setShowRunAnalysisBtn] = useState(false);
  const [showNextBtn, setShowNextBtn] = useState(false);
  const [showSkipBtn, setShowSkipBtn] = useState(false);

  useEffect(() => {
    if (haveUnRunOperations) {
      setShowRunAnalysisBtn(true);
      setShowNextBtn(false);
      setShowSkipBtn(false);
      return;
    }

    if (!delegationContract?.length) {
      setShowRunAnalysisBtn(false);
      setShowNextBtn(false);
      setShowSkipBtn(true);
      return;
    }

    setShowRunAnalysisBtn(false);
    setShowNextBtn(true);
    setShowSkipBtn(false);
  }, [haveUnRunOperations, delegationContract]);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.MAP_DELEGATIONS} />
      <DistributionPlanStepWrapper>
        {delegationContract ? (
          <MapDelegationsDone contract={delegationContract} />
        ) : (
          <MapDelegationsForm />
        )}
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={showRunAnalysisBtn}
          onNextStep={() => setStep(DistributionPlanToolStep.REVIEW)}
          loading={false}
          showNextBtn={showNextBtn}
          showSkipBtn={showSkipBtn}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
