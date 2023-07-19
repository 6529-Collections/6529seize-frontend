import { useCopyToClipboard } from "react-use";
import DistributionPlanTableRowWrapper from "../../common/DistributionPlanTableRowWrapper";
import { truncateTextMiddle } from "../../../../helpers/AllowlistToolHelpers";
import { useEffect, useState } from "react";
import Tippy from "@tippyjs/react";
import { CreateSnapshotSnapshot } from "../CreateSnapshots";

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

  return (
    <DistributionPlanTableRowWrapper>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {snapshot.name}
      </td>
      <td
        onClick={copyContract}
        className="tw-cursor-pointer tw-group tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
      >
        <div className="tw-h-full tw-flex tw-items-center">
          <span>{contractText}</span>
          <svg
            className="tw-h-5 tw-w-5 tw-ml-2.5 group-hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
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
        className="tw-cursor-pointer tw-group tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
      >
        <div className="tw-h-full tw-flex tw-items-center">
          <span> {blockNoText}</span>
          <svg
            className="tw-h-5 tw-w-5 tw-ml-2.5 group-hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
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
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300 tw-inline-flex">
        {tokenIdsTruncated}
        <div className="tw-pl-2">
          <Tippy content={tokenIdsTooltip} placement="top" theme="dark">
            <svg
              className="tw-h-5 tw-w-5 tw-text-neutral-500 tw-cursor-pointer"
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
          </Tippy>
        </div>
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.walletsCount ?? "N/A"}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-font-normal tw-text-neutral-300">
        {snapshot.tokensCount ?? "N/A"}
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
