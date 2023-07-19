import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import { AllowlistOperationCode } from "../../allowlist-tool/allowlist-tool.types";
import CreateSnapshotTable from "./table/CreateSnapshotTable";
import CreateSnapshotForm from "./form/CreateSnapshotForm";
import StepHeader from "../common/StepHeader";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
import DistributionPlanEmptyTablePlaceholder from "../common/DistributionPlanEmptyTablePlaceholder";

export interface CreateSnapshotSnapshot {
  id: string;
  name: string;
  description: string;
  transferPoolId: string;
  tokenIds: string | null;
  walletsCount: number | null;
  tokensCount: number | null;
  contract: string | null;
  blockNo: number | null;
}

export default function CreateSnapshots() {
  const { setStep, distributionPlan, operations, tokenPools } = useContext(
    DistributionPlanToolContext
  );

  useEffect(() => {
    if (!distributionPlan) setStep(DistributionPlanToolStep.CREATE_PLAN);
  }, [distributionPlan, setStep]);

  const [haveUnRunOperations, setHaveUnRunOperations] = useState(false);

  useEffect(() => {
    setHaveUnRunOperations(
      !!operations.filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL &&
          operation.hasRan === false
      ).length
    );
  }, [operations]);

  const [snapshots, setSnapshots] = useState<CreateSnapshotSnapshot[]>([]);

  useEffect(() => {
    const createTokenPoolOperations = operations.filter(
      (operation) => operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL
    );

    setSnapshots(
      createTokenPoolOperations.map((createTokenPoolOperation) => {
        const tokenPool =
          tokenPools.find(
            (tokenPool) => tokenPool.id === createTokenPoolOperation.params.id
          ) ?? null;

        return {
          id: createTokenPoolOperation.params.id,
          name: createTokenPoolOperation.params.name,
          description: createTokenPoolOperation.params.description,
          transferPoolId: createTokenPoolOperation.params.transferPoolId,
          tokenIds: createTokenPoolOperation.params.tokenIds,
          walletsCount: tokenPool?.walletsCount ?? null,
          tokensCount: tokenPool?.tokensCount ?? null,
          contract: createTokenPoolOperation?.params.contract ?? null,
          blockNo: createTokenPoolOperation?.params.blockNo ?? null,
        };
      })
    );
  }, [operations, tokenPools]);

  const [haveSnapshots, setHaveSnapshots] = useState(false);

  useEffect(() => {
    setHaveSnapshots(!!snapshots.length);
  }, [snapshots]);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_SNAPSHOTS} />
      <DistributionPlanStepWrapper>
        <CreateSnapshotForm />
        <div className="tw-mt-8">
          {haveSnapshots ? (
            <CreateSnapshotTable snapshots={snapshots} />
          ) : (
            <DistributionPlanEmptyTablePlaceholder
              title="No Collection Snapshots Added"
              description="To proceed, please add your snapshots. This space will showcase your collection once they're added."
            />
          )}
        </div>
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={haveUnRunOperations}
          onNextStep={() =>
            setStep(DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT)
          }
          loading={false}
          showNextBtn={haveSnapshots}
          showSkipBtn={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
