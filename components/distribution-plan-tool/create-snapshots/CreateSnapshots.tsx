"use client";

import type { DistributionPlanTokenPoolDownload } from "@/components/allowlist-tool/allowlist-tool.types";
import {
  AllowlistOperationCode,
  DistributionPlanTokenPoolDownloadStatus,
} from "@/components/allowlist-tool/allowlist-tool.types";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { useContext, useEffect, useState } from "react";
import { useInterval } from "react-use";
import DistributionPlanEmptyTablePlaceholder from "../common/DistributionPlanEmptyTablePlaceholder";
import DistributionPlanNextStepBtn from "../common/DistributionPlanNextStepBtn";
import DistributionPlanStepWrapper from "../common/DistributionPlanStepWrapper";
import StepHeader from "../common/StepHeader";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import CreateSnapshotForm from "./form/CreateSnapshotForm";
import CreateSnapshotTable from "./table/CreateSnapshotTable";

interface CreateTokenPoolOperationParams {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tokenIds?: string | undefined;
  readonly contract?: string | undefined;
  readonly blockNo?: number | undefined;
  readonly consolidateBlockNo?: number | null | undefined;
}

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
  download: DistributionPlanTokenPoolDownload | null;
  allowlistId: string;
  order: number;
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toCreateTokenPoolOperationParams = (
  value: unknown
): CreateTokenPoolOperationParams | null => {
  if (!isObjectRecord(value)) {
    return null;
  }

  const {
    id,
    name,
    description,
    tokenIds,
    contract,
    blockNo,
    consolidateBlockNo,
  } = value;

  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof description !== "string"
  ) {
    return null;
  }

  return {
    id,
    name,
    description,
    tokenIds: typeof tokenIds === "string" ? tokenIds : undefined,
    contract: typeof contract === "string" ? contract : undefined,
    blockNo: typeof blockNo === "number" ? blockNo : undefined,
    consolidateBlockNo:
      typeof consolidateBlockNo === "number" || consolidateBlockNo === null
        ? consolidateBlockNo
        : undefined,
  };
};

const loadTokenPoolDownloads = async (
  allowlistId: string
): Promise<DistributionPlanTokenPoolDownload[] | null> => {
  const endpoint = `/allowlists/${allowlistId}/token-pool-downloads`;
  const { success, data } =
    await distributionPlanApiFetch<DistributionPlanTokenPoolDownload[]>(
      endpoint
    );
  if (!success) {
    return null;
  }
  return data;
};

export default function CreateSnapshots() {
  const { setStep, distributionPlan, operations, tokenPools } = useContext(
    DistributionPlanToolContext
  );

  useEffect(() => {
    if (distributionPlan === null) {
      setStep(DistributionPlanToolStep.CREATE_PLAN);
    }
  }, [distributionPlan, setStep]);

  const [tokenPoolDownloads, setTokenPoolDownloads] = useState<
    DistributionPlanTokenPoolDownload[]
  >([]);

  const haveUnRunOperations = operations.some(
    (operation) =>
      operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL &&
      operation.hasRan === false
  );

  const snapshots = operations
    .filter(
      (operation) => operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL
    )
    .map((createTokenPoolOperation) => {
      const params = toCreateTokenPoolOperationParams(
        createTokenPoolOperation.params
      );
      if (params === null) {
        return null;
      }

      const tokenPool = tokenPools.find((tp) => tp.id === params.id) ?? null;
      const tokenPoolDownload =
        tokenPoolDownloads.find(
          (download) => download.tokenPoolId === params.id
        ) ?? null;

      return {
        id: params.id,
        name: params.name,
        description: params.description,
        tokenIds: params.tokenIds ?? null,
        walletsCount: tokenPool?.walletsCount ?? null,
        tokensCount: tokenPool?.tokensCount ?? null,
        contract: params.contract ?? null,
        blockNo: params.blockNo ?? null,
        consolidateBlockNo: params.consolidateBlockNo ?? null,
        download: tokenPoolDownload,
        allowlistId: createTokenPoolOperation.allowlistId,
        order: createTokenPoolOperation.order,
      };
    })
    .filter(
      (snapshot): snapshot is CreateSnapshotSnapshot => snapshot !== null
    );

  const fetchTokenPoolStatuses = async () => {
    if (distributionPlan === null) {
      return;
    }
    const data = await loadTokenPoolDownloads(distributionPlan.id);
    if (data !== null) {
      setTokenPoolDownloads(data);
    }
  };

  useEffect(() => {
    if (distributionPlan === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const data = await loadTokenPoolDownloads(distributionPlan.id);
        if (data !== null) {
          setTokenPoolDownloads(data);
        }
      })();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [distributionPlan]);

  const activeSnapshots = snapshots.filter((snapshot) => {
    const rawStatus = snapshot.download?.rawStatus ?? null;
    return (
      !snapshot.download ||
      rawStatus === DistributionPlanTokenPoolDownloadStatus.PENDING ||
      rawStatus === DistributionPlanTokenPoolDownloadStatus.CLAIMED
    );
  });

  const unresolvedSnapshots = snapshots.filter(
    (snapshot) =>
      !snapshot.download ||
      snapshot.download.status !==
        DistributionPlanTokenPoolDownloadStatus.COMPLETED
  );

  const failedSnapshots = unresolvedSnapshots.filter(
    (snapshot) =>
      snapshot.download?.status ===
      DistributionPlanTokenPoolDownloadStatus.FAILED
  );

  const haveSnapshots = !!snapshots.length;
  const allSnapshotsCompleted =
    haveSnapshots &&
    snapshots.every(
      (snapshot) =>
        snapshot.download?.status ===
        DistributionPlanTokenPoolDownloadStatus.COMPLETED
    );

  let pollingDelay: number | null = null;
  if (activeSnapshots.length > 0) {
    pollingDelay = 2000;
  } else if (unresolvedSnapshots.length > 0) {
    pollingDelay = 10000;
  }

  useInterval(
    () => {
      void fetchTokenPoolStatuses();
    },
    distributionPlan?.id ? pollingDelay : null
  );

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_SNAPSHOTS} />
      <p className="tw-mt-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
        * Please note: During this stage, some processes may take a moment to
        load.
      </p>
      {!!failedSnapshots.length && (
        <div className="tw-mt-4 tw-rounded-lg tw-bg-[#282026]/80 tw-p-4 tw-ring-1 tw-ring-[#632c28]">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-error">
            Snapshot attention required
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-font-light tw-text-[#fcc5c1]">
            {failedSnapshots.length} snapshot
            {failedSnapshots.length > 1 ? "s are" : " is"} unresolved. Retry or
            delete failed snapshots before moving on. EMMA will keep checking in
            the background for late completions.
          </p>
        </div>
      )}

      <DistributionPlanStepWrapper>
        <CreateSnapshotForm />
        <div className="tw-mt-8">
          {haveSnapshots ? (
            <CreateSnapshotTable
              snapshots={snapshots}
              refreshDownloads={fetchTokenPoolStatuses}
            />
          ) : (
            <DistributionPlanEmptyTablePlaceholder
              title="No Collection Snapshots Added"
              description="To proceed, please add your snapshots. This space will showcase your collection once they're added."
            />
          )}
        </div>
        <DistributionPlanNextStepBtn
          showRunAnalysisBtn={allSnapshotsCompleted && haveUnRunOperations}
          onNextStep={() =>
            setStep(DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT)
          }
          loading={false}
          showNextBtn={haveSnapshots}
          showSkipBtn={false}
          disableNextBtn={!allSnapshotsCompleted}
        />
      </DistributionPlanStepWrapper>
    </div>
  );
}
