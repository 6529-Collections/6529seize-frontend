import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import { FetchResultsType } from "../../review-distribution-plan/table/ReviewDistributionPlanTable";
import {
  AllowlistToolResponse,
  DistributionPlanSnapshotToken,
} from "../../../allowlist-tool/allowlist-tool.types";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import RoundedJsonIconButton from "../../common/RoundedJsonIconButton";
import RoundedCsvIconButton from "../../common/RoundedCsvIconButton";

export default function CreateSnapshotTableRowDownload({
  tokenPoolId,
}: {
  tokenPoolId: string;
}) {
  const { distributionPlan, setToasts } = useContext(
    DistributionPlanToolContext
  );

  const [loadingType, setLoadingType] = useState<FetchResultsType | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);

  useEffect(() => {
    setIsLoadingJson(loadingType === FetchResultsType.JSON);
    setIsLoadingCsv(loadingType === FetchResultsType.CSV);
  }, [loadingType]);

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
    if (loadingType) return;
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/token-pool-downloads/token-pool/${tokenPoolId}/tokens`;
    setLoadingType(fetchType);
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
        case FetchResultsType.MANIFOLD:
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
      setLoadingType(null);
    }
  };
  return (
    <div className="tw-flex tw-justify-end tw-gap-x-3">
      <RoundedJsonIconButton
        onClick={() => fetchResults(FetchResultsType.JSON)}
        loading={isLoadingJson}
      />

      <RoundedCsvIconButton
        onClick={() => fetchResults(FetchResultsType.CSV)}
        loading={isLoadingCsv}
      />
    </div>
  );
}
