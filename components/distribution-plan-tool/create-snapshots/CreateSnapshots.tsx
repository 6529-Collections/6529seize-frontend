"use client";

import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import {
  AllowlistOperationCode,
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
import { distributionPlanApiFetch } from "../../../services/distribution-plan-api";

export interface CreateSnapshotSnapshot {
  id: string;
  name: string;
  description: string;
  tokenIds: string | null;
  walletsCount: number | null;
  tokensCount: number | null;
  contract: string | null;
  blockNo: number | null;
  consolidateBlockNo: number | null;
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
    const generateSnapshots = () => {
      const createTokenPoolOperations = operations.filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL
      );
      return createTokenPoolOperations.map((createTokenPoolOperation) => {
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
          tokenIds: createTokenPoolOperation.params.tokenIds,
          walletsCount: tokenPool?.walletsCount ?? null,
          tokensCount: tokenPool?.tokensCount ?? null,
          contract: createTokenPoolOperation?.params.contract ?? null,
          blockNo: createTokenPoolOperation?.params.blockNo ?? null,
          consolidateBlockNo:
            createTokenPoolOperation?.params.consolidateBlockNo ?? null,
          downloaderStatus: tokenPoolDownload?.status ?? null,
        };
      });
    };
    setSnapshots(generateSnapshots());
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
    const endpoint = `/allowlists/${distributionPlan.id}/token-pool-downloads`;
    const { success, data } = await distributionPlanApiFetch<
      DistributionPlanTokenPoolDownload[]
    >(endpoint);
    if (success && data) {
      setTokenPoolDownloads(data);
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
      <p className="tw-mt-2 tw-block tw-font-semibold tw-text-sm tw-text-neutral-100">
        * Please note: During this stage, some processes may take a moment to
        load.
      </p>

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
