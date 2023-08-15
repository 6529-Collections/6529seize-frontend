import { useContext, useState } from "react";
import AllowlistToolCsvIcon from "../../../allowlist-tool/icons/AllowlistToolCsvIcon";
import AllowlistToolJsonIcon from "../../../allowlist-tool/icons/AllowlistToolJsonIcon";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import { FetchResultsType } from "../../review-distribution-plan/table/ReviewDistributionPlanTable";
import {
  AllowlistToolResponse,
  DistributionPlanSnapshotToken,
} from "../../../allowlist-tool/allowlist-tool.types";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";

export default function CreateSnapshotTableRowDownload({
  tokenPoolId,
}: {
  tokenPoolId: string;
}) {
  const { distributionPlan, setToasts } = useContext(
    DistributionPlanToolContext
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const downloadJson = (results: DistributionPlanSnapshotToken[]) => {
    const data = JSON.stringify(results);
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "results.json";
    link.click();
  };

  const downloadCsv = (results: DistributionPlanSnapshotToken[]) => {
    const csv = [
      Object.keys(results[0]).join(","),
      ...results.map((item) => Object.values(item).join(",")),
    ].join("\n");

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = "data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchResults = async (fetchType: FetchResultsType) => {
    if (!distributionPlan) return;
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/token-pool-downloads/token-pool/${tokenPoolId}/tokens`;
    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: AllowlistToolResponse<DistributionPlanSnapshotToken[]> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return;
      }

      switch (fetchType) {
        case FetchResultsType.JSON:
          downloadJson(data);
          break;
        case FetchResultsType.CSV:
          downloadCsv(data);
          break;
        default:
          assertUnreachable(fetchType);
      }
    } catch (error) {
      setToasts({
        messages: ["Something went wrong"],
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="tw-flex tw-justify-end tw-gap-x-3">
      <button
        onClick={() => fetchResults(FetchResultsType.JSON)}
        type="button"
        className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20 hover:tw-bg-neutral-400/20 tw-ease-out tw-transition tw-duration-300"
      >
        <div className="tw-h-3.5 tw-w-3.5 tw-flex tw-items-center tw-justify-center">
          <AllowlistToolJsonIcon />
        </div>
      </button>
      <button
        onClick={() => fetchResults(FetchResultsType.CSV)}
        type="button"
        className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20 hover:tw-bg-neutral-400/20 tw-ease-out tw-transition tw-duration-300"
      >
        <div className="tw-h-3.5 tw-w-3.5 tw-flex tw-items-center tw-justify-center">
          <AllowlistToolCsvIcon />
        </div>
      </button>
    </div>
  );
}
