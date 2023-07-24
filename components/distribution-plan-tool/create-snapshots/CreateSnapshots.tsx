import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import {
  AllowlistOperationCode,
  AllowlistRunStatus,
  AllowlistToolResponse,
  DistributionPlanTokenPoolDownload,
  DistributionPlanTokenPoolDownloadStatus,
} from "../../allowlist-tool/allowlist-tool.types";
import CreateSnapshotTable from "./table/CreateSnapshotTable";
import CreateSnapshotForm from "./form/CreateSnapshotForm";
import StepHeader from "../common/StepHeader";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
import DistributionPlanEmptyTablePlaceholder from "../common/DistributionPlanEmptyTablePlaceholder";
import { useInterval } from "react-use";

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
  downloaderStatus: DistributionPlanTokenPoolDownloadStatus | null;
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
  const [tokenPoolDownloads, setTokenPoolDownloads] = useState<
    DistributionPlanTokenPoolDownload[]
  >([]);

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

        const tokenPoolDownload = tokenPoolDownloads.find(
          (tokenPoolDownload) =>
            tokenPoolDownload.tokenPoolId === createTokenPoolOperation.params.id
        );

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
          downloaderStatus: tokenPoolDownload?.status ?? null,
        };
      })
    );
  }, [operations, tokenPools, tokenPoolDownloads]);

  const [haveSnapshots, setHaveSnapshots] = useState(false);
  const [shouldRunDownloadCheck, setShouldRunDownloadCheck] = useState(false);

  useEffect(() => {
    if (!distributionPlan) {
      setShouldRunDownloadCheck(false);
    }

    const haveActiveDownloads = snapshots.some(
      (snapshot) =>
        !snapshot.downloaderStatus ||
        [
          DistributionPlanTokenPoolDownloadStatus.PENDING,
          DistributionPlanTokenPoolDownloadStatus.CLAIMED,
        ].includes(snapshot.downloaderStatus)
    );
    setShouldRunDownloadCheck(haveActiveDownloads);
  }, [distributionPlan, snapshots]);

  useEffect(() => {
    setHaveSnapshots(!!snapshots.length);
  }, [snapshots]);

  const fetchTokenPoolStatuses = async () => {
    if (!distributionPlan) return;
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/token-pool-downloads`;
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: AllowlistToolResponse<DistributionPlanTokenPoolDownload[]> =
        await response.json();
      if ("error" in data) {
        setTokenPoolDownloads([]);
        return;
      }
      setTokenPoolDownloads(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTokenPoolStatuses();
  }, []);

  useInterval(
    async () => {
      await fetchTokenPoolStatuses();
    },
    shouldRunDownloadCheck ? 2000 : null
  );

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
          showRunAnalysisBtn={!shouldRunDownloadCheck && haveUnRunOperations}
          onNextStep={() =>
            setStep(DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT)
          }
          loading={false}
          showNextBtn={!shouldRunDownloadCheck && haveSnapshots}
          showSkipBtn={false}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
