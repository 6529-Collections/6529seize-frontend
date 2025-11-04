"use client";

import { DistributionPlanTokenPoolDownloadStatus } from "@/components/allowlist-tool/allowlist-tool.types";
import DistributionPlanTableRowWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableRowWrapper";
import { truncateTextMiddle } from "@/helpers/AllowlistToolHelpers";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import { CreateSnapshotSnapshot } from "../CreateSnapshots";
import CreateSnapshotTableRowDownload from "./CreateSnapshotTableRowDownload";

export default function CreateSnapshotTableRow({
  snapshot,
}: {
  snapshot: CreateSnapshotSnapshot;
}) {
  const [copyState, copyToClipboard] = useCopyToClipboard();
  const getContractTruncated = () => {
    if (!snapshot.contract) {
      return "";
    }
    return truncateTextMiddle(snapshot.contract, 11);
  };
  const [contractText, setContractText] = useState<string>(
    getContractTruncated()
  );

  const copyContract = () => {
    if (!snapshot.contract) {
      return;
    }
    copyToClipboard(snapshot.contract);
    setContractText("Copied");
    setTimeout(() => setContractText(getContractTruncated()), 3000);
  };

  const [blockNo, setBlockNo] = useState<string>(
    snapshot.blockNo?.toString() ?? ""
  );

  useEffect(() => {
    setBlockNo(snapshot.blockNo?.toString() ?? "");
  }, [snapshot.blockNo]);

  const [blockNoText, setBlockNoText] = useState<string>(blockNo);
  const copyBlockNumber = () => {
    copyToClipboard(blockNo);
    setBlockNoText("Copied");
    setTimeout(() => setBlockNoText(blockNo), 3000);
  };

  const [consolidatedBlockNo, setConsolidatedBlockNo] = useState<string>(
    snapshot.consolidateBlockNo?.toString() ?? ""
  );

  const [haveConsolidatedBlockNo, setHaveConsolidatedBlockNo] =
    useState<boolean>(false);

  useEffect(
    () => setHaveConsolidatedBlockNo(!!consolidatedBlockNo.length),
    [consolidatedBlockNo]
  );

  useEffect(() => {
    setConsolidatedBlockNo(snapshot.consolidateBlockNo?.toString() ?? "");
  }, [snapshot.consolidateBlockNo]);

  const [consolidatedBlockNoText, setConsolidatedBlockNoText] =
    useState<string>(consolidatedBlockNo);

  const copyConsolidatedBlockNumber = () => {
    if (!haveConsolidatedBlockNo) {
      return;
    }
    copyToClipboard(consolidatedBlockNo);
    setConsolidatedBlockNoText("Copied");
    setTimeout(() => setConsolidatedBlockNoText(consolidatedBlockNo), 3000);
  };

  const [tokenIdsTruncated, setTokenIdsTruncated] = useState<string>("");
  const [tokenIdsTooltip, setTokenIdsTooltip] = useState<string>("");
  useEffect(() => {
    if (!snapshot.tokenIds) {
      setTokenIdsTruncated("All");
      setTokenIdsTooltip("All");
      return;
    }
    setTokenIdsTooltip(snapshot.tokenIds);
    if (snapshot.tokenIds.length > 20) {
      setTokenIdsTruncated(truncateTextMiddle(snapshot.tokenIds, 20));
      return;
    }
    setTokenIdsTruncated(snapshot.tokenIds);
  }, [snapshot.tokenIds]);

  const [isGeneratingSnapshot, setIsGeneratingSnapshot] =
    useState<boolean>(false);

  useEffect(() => {
    if (
      !snapshot.downloaderStatus ||
      ![
        DistributionPlanTokenPoolDownloadStatus.COMPLETED,
        DistributionPlanTokenPoolDownloadStatus.FAILED,
      ].includes(snapshot.downloaderStatus)
    ) {
      setIsGeneratingSnapshot(true);
      return;
    }
    setIsGeneratingSnapshot(false);
  }, [snapshot.downloaderStatus]);

  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  useEffect(() => {
    if (
      !snapshot.downloaderStatus ||
      snapshot.downloaderStatus !==
        DistributionPlanTokenPoolDownloadStatus.COMPLETED
    ) {
      setIsCompleted(false);
      return;
    }
    setIsCompleted(true);
  }, [snapshot.downloaderStatus]);

  return (
    <DistributionPlanTableRowWrapper>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {snapshot.name}
      </td>
      <td
        onClick={copyContract}
        className="tw-cursor-pointer tw-group tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out">
        <div className="tw-h-full tw-flex tw-items-center">
          <span>{contractText}</span>
          <svg
            className="tw-h-5 tw-w-5 tw-ml-2.5 group-hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
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
        className="tw-cursor-pointer tw-group tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out">
        <div className="tw-h-full tw-flex tw-items-center">
          <span>{blockNoText}</span>
          <svg
            className="tw-h-5 tw-w-5 tw-ml-2.5 group-hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
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
        <div className="tw-h-full tw-flex tw-items-center">
          <span>{tokenIdsTruncated}</span>
          <div className="tw-pl-2 -tw-mt-0.5">
            <svg
              data-tooltip-id={`token-ids-tooltip-${snapshot.id}`}
              className="tw-h-4 tw-w-4 tw-text-iron-500 tw-cursor-pointer"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
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
        } tw-group tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out`}>
        {haveConsolidatedBlockNo && (
          <div className="tw-h-full tw-flex tw-items-center">
            <span> {consolidatedBlockNoText}</span>
            <svg
              className="tw-h-5 tw-w-5 tw-ml-2.5 group-hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
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
        {isGeneratingSnapshot ? (
          <svg
            aria-hidden="true"
            role="status"
            className="tw-w-5 tw-h-5 tw-text-primary-400 tw-animate-spin"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              className="tw-text-iron-600"
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"></path>
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentColor"></path>
          </svg>
        ) : (
          <span
            className={`tw-text-xs tw-font-medium tw-mr-2 tw-px-2.5 tw-py-0.5 tw-rounded-md ${
              snapshot.downloaderStatus ===
              DistributionPlanTokenPoolDownloadStatus.COMPLETED
                ? "tw-bg-[#EAFAE4]/10 tw-text-success"
                : "tw-bg-[#312524] tw-text-[#FF6A55]"
            }`}>
            {snapshot.downloaderStatus}
          </span>
        )}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-iron-300">
        {isCompleted && (
          <CreateSnapshotTableRowDownload tokenPoolId={snapshot.id} />
        )}
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
