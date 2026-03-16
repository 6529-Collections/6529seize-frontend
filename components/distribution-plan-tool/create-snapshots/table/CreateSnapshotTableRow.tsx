"use client";

import type { DistributionPlanTokenPoolDownload } from "@/components/allowlist-tool/allowlist-tool.types";
import {
  DistributionPlanTokenPoolDownloadStage,
  DistributionPlanTokenPoolDownloadStatus,
} from "@/components/allowlist-tool/allowlist-tool.types";
import AllowlistToolLoader, {
  AllowlistToolLoaderSize,
} from "@/components/allowlist-tool/common/AllowlistToolLoader";
import DistributionPlanTableRowWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableRowWrapper";
import DistributionPlanDeleteOperationButton from "@/components/distribution-plan-tool/common/DistributionPlanDeleteOperationButton";
import { truncateTextMiddle } from "@/helpers/AllowlistToolHelpers";
import { useState } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import type { CreateSnapshotSnapshot } from "../CreateSnapshots";
import CreateSnapshotTableRowDownload from "./CreateSnapshotTableRowDownload";
import CreateSnapshotTableRowRetry from "./CreateSnapshotTableRowRetry";

type CopyableField = "contract" | "blockNo" | "consolidatedBlockNo" | null;

const truncateMessage = (message: string, max = 110): string =>
  message.length > max ? `${message.slice(0, max - 3)}...` : message;

const getStatusLabel = (
  download: DistributionPlanTokenPoolDownload | null
): string => {
  if (!download) {
    return "Starting";
  }
  if (download.status === DistributionPlanTokenPoolDownloadStatus.COMPLETED) {
    return "Completed";
  }
  if (download.stale) {
    return "Stalled";
  }
  if (download.rawStatus === DistributionPlanTokenPoolDownloadStatus.FAILED) {
    return "Failed";
  }
  if (
    download.failureCount > 0 &&
    [
      DistributionPlanTokenPoolDownloadStatus.PENDING,
      DistributionPlanTokenPoolDownloadStatus.CLAIMED,
    ].includes(download.rawStatus)
  ) {
    return "Retrying";
  }
  if (download.rawStatus === DistributionPlanTokenPoolDownloadStatus.CLAIMED) {
    return "Processing";
  }
  return "Queued";
};

const getStatusClasses = (
  download: DistributionPlanTokenPoolDownload | null
): string => {
  if (!download) {
    return "tw-bg-primary-400/10 tw-text-primary-300";
  }
  if (download.status === DistributionPlanTokenPoolDownloadStatus.COMPLETED) {
    return "tw-bg-[#EAFAE4]/10 tw-text-success";
  }
  if (
    download.stale ||
    download.rawStatus === DistributionPlanTokenPoolDownloadStatus.FAILED
  ) {
    return "tw-bg-[#312524] tw-text-[#FF6A55]";
  }
  if (download.failureCount > 0) {
    return "tw-bg-[#4C3A19] tw-text-[#F5C66D]";
  }
  return "tw-bg-primary-400/10 tw-text-primary-300";
};

const getStageLabel = (
  download: DistributionPlanTokenPoolDownload | null
): string => {
  if (!download) {
    return "Waiting for first status update";
  }
  switch (download.stage) {
    case undefined:
      if (
        download.rawStatus === DistributionPlanTokenPoolDownloadStatus.CLAIMED
      ) {
        return "Worker is processing the snapshot";
      }
      if (
        download.rawStatus === DistributionPlanTokenPoolDownloadStatus.PENDING
      ) {
        return "Queued for processing";
      }
      return "No stage available yet";
    case DistributionPlanTokenPoolDownloadStage.PREPARING:
      return "Preparing snapshot job";
    case DistributionPlanTokenPoolDownloadStage.REQUEUED:
      return "Re-queued for another pass";
    case DistributionPlanTokenPoolDownloadStage.CLAIMED:
      return "Worker claimed snapshot job";
    case DistributionPlanTokenPoolDownloadStage.CHECKING_ALCHEMY:
      return "Checking archive-node availability";
    case DistributionPlanTokenPoolDownloadStage.INDEXING_SINGLE:
      return "Indexing single transfers";
    case DistributionPlanTokenPoolDownloadStage.INDEXING_BATCH:
      return "Indexing batch transfers";
    case DistributionPlanTokenPoolDownloadStage.BUILDING_TOKEN_OWNERS:
      return "Building holder state";
    case DistributionPlanTokenPoolDownloadStage.PERSISTING_RESULTS:
      return "Saving snapshot results";
    case DistributionPlanTokenPoolDownloadStage.COMPLETED:
      return "Snapshot ready";
    case DistributionPlanTokenPoolDownloadStage.FAILED:
      return "Snapshot failed";
  }
};

const getProgressNumber = (
  download: DistributionPlanTokenPoolDownload | null,
  key: string
): number | null => {
  if (!download?.progress) {
    return null;
  }
  const value = download.progress[key];
  return typeof value === "number" ? value : null;
};

const getExecutionPath = (
  download: DistributionPlanTokenPoolDownload | null
): "FAST" | "SLOW" | null => {
  if (!download?.progress) {
    return null;
  }
  const value = download.progress["executionPath"];
  if (value === "FAST" || value === "SLOW") {
    return value;
  }
  return null;
};

const getExecutionPathLabel = (
  executionPath: "FAST" | "SLOW" | null
): string | null => {
  if (executionPath === "FAST") {
    return "Fast path";
  }
  if (executionPath === "SLOW") {
    return "Slow path";
  }
  return null;
};

const getExecutionPathClasses = (
  executionPath: "FAST" | "SLOW" | null
): string => {
  if (executionPath === "FAST") {
    return "tw-bg-[#203425] tw-text-[#8CE8A4]";
  }
  if (executionPath === "SLOW") {
    return "tw-bg-[#332819] tw-text-[#F5C66D]";
  }
  return "";
};

const getProgressSummary = (
  download: DistributionPlanTokenPoolDownload | null
): string => {
  if (!download) {
    return "Waiting for the snapshot job to be created";
  }
  const currentBlockNo = getProgressNumber(download, "currentBlockNo");
  const targetBlockNo = getProgressNumber(download, "targetBlockNo");
  if (currentBlockNo !== null && targetBlockNo !== null) {
    return `Current block ${currentBlockNo.toLocaleString()} / ${targetBlockNo.toLocaleString()}`;
  }
  if (currentBlockNo !== null) {
    return `Current block ${currentBlockNo.toLocaleString()}`;
  }
  const latestFetchedBlockNo = getProgressNumber(
    download,
    "latestFetchedBlockNo"
  );
  if (latestFetchedBlockNo !== null && targetBlockNo !== null) {
    return `Indexed block ${latestFetchedBlockNo.toLocaleString()} / ${targetBlockNo.toLocaleString()}`;
  }
  const tokenOwnershipsCount = getProgressNumber(
    download,
    "tokenOwnershipsCount"
  );
  if (tokenOwnershipsCount !== null) {
    return `Prepared ${tokenOwnershipsCount.toLocaleString()} token ownerships`;
  }
  const transfersPersisted = getProgressNumber(download, "transfersPersisted");
  if (transfersPersisted !== null) {
    return `Saved ${transfersPersisted.toLocaleString()} transfers in the latest batch`;
  }
  const blockNo = getProgressNumber(download, "blockNo");
  if (blockNo !== null) {
    return `Target block ${blockNo.toLocaleString()}`;
  }
  if (download.status === DistributionPlanTokenPoolDownloadStatus.COMPLETED) {
    return "Snapshot holders are ready to use";
  }
  if (download.retryable) {
    return "Needs retry or removal before the plan can continue";
  }
  return "Progress data will appear here as the job advances";
};

const getReferenceTime = (
  download: DistributionPlanTokenPoolDownload | null
): number | null =>
  download?.lastHeartbeatAt ??
  download?.updatedAt ??
  download?.claimedAt ??
  download?.createdAt ??
  null;

const getActivitySummary = (
  download: DistributionPlanTokenPoolDownload | null
): string | null => {
  if (!download) {
    return null;
  }
  const pieces: string[] = [];
  const referenceTime = getReferenceTime(download);
  if (referenceTime !== null) {
    pieces.push(`Updated ${formatActivityTime(referenceTime)}`);
  }
  if (download.attemptCount > 0) {
    pieces.push(`Attempt ${download.attemptCount}`);
  }
  if (download.failureCount > 0) {
    pieces.push(`Failed ${download.failureCount}x`);
  }
  return pieces.length ? pieces.join(" • ") : null;
};

const getCurrentIssue = (
  download: DistributionPlanTokenPoolDownload | null
): string | null => {
  if (!download?.errorReason) {
    return null;
  }
  if (
    download.retryable ||
    download.rawStatus === DistributionPlanTokenPoolDownloadStatus.FAILED
  ) {
    return truncateMessage(download.errorReason);
  }
  return null;
};

const getPreviousFailure = (
  download: DistributionPlanTokenPoolDownload | null
): string | null => {
  if (
    !download ||
    download.failureCount < 1 ||
    typeof download.lastFailureReason !== "string" ||
    download.lastFailureReason.length === 0
  ) {
    return null;
  }
  const failureTime =
    download.lastFailureAt !== undefined
      ? ` at ${formatActivityTime(download.lastFailureAt)}`
      : "";
  return `Previous failure${failureTime}: ${truncateMessage(
    download.lastFailureReason
  )}`;
};

const formatActivityTime = (timestamp: number): string =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

export default function CreateSnapshotTableRow({
  snapshot,
  refreshDownloads,
}: {
  snapshot: CreateSnapshotSnapshot;
  refreshDownloads: () => Promise<void>;
}) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const download = snapshot.download;
  const [copiedField, setCopiedField] = useState<CopyableField>(null);

  let contractText = "";
  if (copiedField === "contract") {
    contractText = "Copied";
  } else if (snapshot.contract !== null) {
    contractText = truncateTextMiddle(snapshot.contract, 11);
  }
  const blockNo = snapshot.blockNo?.toString() ?? "";
  const blockNoText = copiedField === "blockNo" ? "Copied" : blockNo;
  const consolidatedBlockNo = snapshot.consolidateBlockNo?.toString() ?? "";
  const haveConsolidatedBlockNo = consolidatedBlockNo.length > 0;
  const consolidatedBlockNoText =
    copiedField === "consolidatedBlockNo" ? "Copied" : consolidatedBlockNo;
  const tokenIdsTooltip = snapshot.tokenIds ?? "All";
  let tokenIdsTruncated = "All";
  if (snapshot.tokenIds !== null) {
    tokenIdsTruncated =
      snapshot.tokenIds.length > 20
        ? truncateTextMiddle(snapshot.tokenIds, 20)
        : snapshot.tokenIds;
  }

  const setCopied = (field: Exclude<CopyableField, null>) => {
    setCopiedField(field);
    window.setTimeout(() => {
      setCopiedField((currentField) =>
        currentField === field ? null : currentField
      );
    }, 3000);
  };

  const copyContract = () => {
    if (snapshot.contract === null) {
      return;
    }
    copyToClipboard(snapshot.contract);
    setCopied("contract");
  };

  const copyBlockNumber = () => {
    if (blockNo.length === 0) {
      return;
    }
    copyToClipboard(blockNo);
    setCopied("blockNo");
  };

  const copyConsolidatedBlockNumber = () => {
    if (!haveConsolidatedBlockNo) {
      return;
    }
    copyToClipboard(consolidatedBlockNo);
    setCopied("consolidatedBlockNo");
  };

  const isCompleted =
    download?.status === DistributionPlanTokenPoolDownloadStatus.COMPLETED;
  const showSpinner =
    !download ||
    (!download.stale &&
      [
        DistributionPlanTokenPoolDownloadStatus.PENDING,
        DistributionPlanTokenPoolDownloadStatus.CLAIMED,
      ].includes(download.rawStatus));
  const currentIssue = getCurrentIssue(download);
  const previousFailure = getPreviousFailure(download);
  const activitySummary = getActivitySummary(download);
  const executionPath = getExecutionPath(download);
  const executionPathLabel = getExecutionPathLabel(executionPath);

  return (
    <DistributionPlanTableRowWrapper>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {snapshot.name}
      </td>
      <td className="tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300">
        <div className="tw-flex tw-min-w-[15rem] tw-flex-col tw-gap-y-1.5">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            {showSpinner && (
              <AllowlistToolLoader size={AllowlistToolLoaderSize.SMALL} />
            )}
            <span
              className={`tw-inline-flex tw-rounded-md tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium ${getStatusClasses(
                download
              )}`}
            >
              {getStatusLabel(download)}
            </span>
            {executionPathLabel && (
              <span
                className={`tw-inline-flex tw-rounded-md tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium ${getExecutionPathClasses(
                  executionPath
                )}`}
              >
                {executionPathLabel}
              </span>
            )}
          </div>
          <p className="tw-m-0 tw-text-xs tw-text-iron-200">
            {getStageLabel(download)}
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {getProgressSummary(download)}
          </p>
          {activitySummary && (
            <p className="tw-m-0 tw-text-xs tw-text-iron-500">
              {activitySummary}
            </p>
          )}
          {previousFailure && (
            <p className="tw-m-0 tw-text-xs tw-text-[#F5C66D]">
              {previousFailure}
            </p>
          )}
          {currentIssue && (
            <p className="tw-m-0 tw-text-xs tw-text-[#fcc5c1]">
              {currentIssue}
            </p>
          )}
        </div>
      </td>
      <td
        onClick={copyContract}
        className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-text-white"
      >
        <div className="tw-flex tw-h-full tw-items-center">
          <span>{contractText}</span>
          <svg
            className="tw-ml-2.5 tw-h-5 tw-w-5 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 15C4.06812 15 3.60218 15 3.23463 14.8478C2.74458 14.6448 2.35523 14.2554 2.15224 13.7654C2 13.3978 2 12.9319 2 12V5.2C2 4.0799 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2H12C12.9319 2 13.3978 2 13.7654 2.15224C14.2554 2.35523 14.6448 2.74458 14.8478 3.23463C15 3.60218 15 4.06812 15 5M12.2 22H18.8C19.9201 22 20.4802 22 20.908 21.782C21.2843 21.5903 21.5903 21.2843 21.782 20.908C22 20.4802 22 19.9201 22 18.8V12.2C22 11.0799 22 10.5198 21.782 10.092C21.5903 9.71569 21.2843 9.40973 20.908 9.21799C20.4802 9 19.9201 9 18.8 9H12.2C11.0799 9 10.5198 9 10.092 9.21799C9.71569 9.40973 9.40973 9.71569 9.21799 10.092C9 10.5198 9 11.0799 9 12.2V18.8C9 19.9201 9 20.4802 9.21799 20.908C9.40973 21.2843 9.71569 21.5903 10.092 21.782C10.5198 22 11.0799 22 12.2 22Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </td>
      <td
        onClick={copyBlockNumber}
        className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-text-white"
      >
        <div className="tw-flex tw-h-full tw-items-center">
          <span>{blockNoText}</span>
          <svg
            className="tw-ml-2.5 tw-h-5 tw-w-5 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 15C4.06812 15 3.60218 15 3.23463 14.8478C2.74458 14.6448 2.35523 14.2554 2.15224 13.7654C2 13.3978 2 12.9319 2 12V5.2C2 4.0799 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2H12C12.9319 2 13.3978 2 13.7654 2.15224C14.2554 2.35523 14.6448 2.74458 14.8478 3.23463C15 3.60218 15 4.06812 15 5M12.2 22H18.8C19.9201 22 20.4802 22 20.908 21.782C21.2843 21.5903 21.5903 21.2843 21.782 20.908C22 20.4802 22 19.9201 22 18.8V12.2C22 11.0799 22 10.5198 21.782 10.092C21.5903 9.71569 21.2843 9.40973 20.908 9.21799C20.4802 9 19.9201 9 18.8 9H12.2C11.0799 9 10.5198 9 10.092 9.21799C9.71569 9.40973 9.40973 9.71569 9.21799 10.092C9 10.5198 9 11.0799 9 12.2V18.8C9 19.9201 9 20.4802 9.21799 20.908C9.40973 21.2843 9.71569 21.5903 10.092 21.782C10.5198 22 11.0799 22 12.2 22Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300">
        <div className="tw-flex tw-h-full tw-items-center">
          <span>{tokenIdsTruncated}</span>
          <div className="-tw-mt-0.5 tw-pl-2">
            <svg
              data-tooltip-id={`token-ids-tooltip-${snapshot.id}`}
              className="tw-h-4 tw-w-4 tw-cursor-pointer tw-text-iron-500"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Tooltip
              id={`token-ids-tooltip-${snapshot.id}`}
              place="top"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
              }}
            >
              {tokenIdsTooltip}
            </Tooltip>
          </div>
        </div>
      </td>
      <td
        onClick={copyConsolidatedBlockNumber}
        className={`${
          haveConsolidatedBlockNo ? "tw-cursor-pointer" : ""
        } tw-group tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-text-white`}
      >
        {haveConsolidatedBlockNo && (
          <div className="tw-flex tw-h-full tw-items-center">
            <span>{consolidatedBlockNoText}</span>
            <svg
              className="tw-ml-2.5 tw-h-5 tw-w-5 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 15C4.06812 15 3.60218 15 3.23463 14.8478C2.74458 14.6448 2.35523 14.2554 2.15224 13.7654C2 13.3978 2 12.9319 2 12V5.2C2 4.0799 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2H12C12.9319 2 13.3978 2 13.7654 2.15224C14.2554 2.35523 14.6448 2.74458 14.8478 3.23463C15 3.60218 15 4.06812 15 5M12.2 22H18.8C19.9201 22 20.4802 22 20.908 21.782C21.2843 21.5903 21.5903 21.2843 21.782 20.908C22 20.4802 22 19.9201 22 18.8V12.2C22 11.0799 22 10.5198 21.782 10.092C21.5903 9.71569 21.2843 9.40973 20.908 9.21799C20.4802 9 19.9201 9 18.8 9H12.2C11.0799 9 10.5198 9 10.092 9.21799C9.71569 9.40973 9.40973 9.71569 9.21799 10.092C9 10.5198 9 11.0799 9 12.2V18.8C9 19.9201 9 20.4802 9.21799 20.908C9.40973 21.2843 9.71569 21.5903 10.092 21.782C10.5198 22 11.0799 22 12.2 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300">
        {snapshot.walletsCount ?? "N/A"}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300">
        {snapshot.tokensCount ?? "N/A"}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300">
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
          {isCompleted && (
            <CreateSnapshotTableRowDownload tokenPoolId={snapshot.id} />
          )}
          {download?.retryable && (
            <CreateSnapshotTableRowRetry
              allowlistId={snapshot.allowlistId}
              tokenPoolId={snapshot.id}
              refreshDownloads={refreshDownloads}
            />
          )}
          <DistributionPlanDeleteOperationButton
            allowlistId={snapshot.allowlistId}
            order={snapshot.order}
          />
        </div>
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
