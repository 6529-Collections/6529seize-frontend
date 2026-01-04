"use client";

import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { FetchResultsType } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTable";
import type { DistributionPlanSnapshotToken } from "@/components/allowlist-tool/allowlist-tool.types";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import RoundedJsonIconButton from "@/components/distribution-plan-tool/common/RoundedJsonIconButton";
import RoundedCsvIconButton from "@/components/distribution-plan-tool/common/RoundedCsvIconButton";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";

export default function CreateSnapshotTableRowDownload({
  tokenPoolId,
}: {
  tokenPoolId: string;
}) {
  const { distributionPlan } = useContext(DistributionPlanToolContext);

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
      Object.keys(results[0]!).join(","),
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
    setLoadingType(fetchType);
    const endpoint = `/allowlists/${distributionPlan.id}/token-pool-downloads/token-pool/${tokenPoolId}/tokens`;
    const { success, data } = await distributionPlanApiFetch<
      DistributionPlanSnapshotToken[]
    >(endpoint);
    if (!success || !data) {
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
    setLoadingType(null);
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
