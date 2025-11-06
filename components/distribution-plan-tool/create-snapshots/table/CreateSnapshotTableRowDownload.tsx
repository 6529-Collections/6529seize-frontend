"use client";

import { useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { DistributionPlanSnapshotToken } from "@/components/allowlist-tool/allowlist-tool.types";
import RoundedJsonIconButton from "@/components/distribution-plan-tool/common/RoundedJsonIconButton";
import RoundedCsvIconButton from "@/components/distribution-plan-tool/common/RoundedCsvIconButton";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";

export default function CreateSnapshotTableRowDownload({
  tokenPoolId,
}: {
  readonly tokenPoolId: string;
}) {
  const { distributionPlan } = useContext(DistributionPlanToolContext);

  const downloadJson = (results: DistributionPlanSnapshotToken[]) => {
    const data = JSON.stringify(results);
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "results.json";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadCsv = (results: DistributionPlanSnapshotToken[]) => {
    if (results.length === 0) return;
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

  const requestSnapshotTokens = async (): Promise<
    DistributionPlanSnapshotToken[]
  > => {
    if (!distributionPlan) {
      throw new Error("No distribution plan");
    }
    const endpoint = `/allowlists/${distributionPlan.id}/token-pool-downloads/token-pool/${tokenPoolId}/tokens`;
    const { success, data } = await distributionPlanApiFetch<
      DistributionPlanSnapshotToken[]
    >(endpoint);
    if (!success || !data) {
      throw new Error("Fetch failed");
    }
    return data;
  };

  const {
    mutate: fetchJson,
    isPending: isLoadingJson,
  } = useMutation({
    mutationFn: requestSnapshotTokens,
    onSuccess: (data) => downloadJson(data),
  });

  const {
    mutate: fetchCsv,
    isPending: isLoadingCsv,
  } = useMutation({
    mutationFn: requestSnapshotTokens,
    onSuccess: (data) => downloadCsv(data),
  });

  const handleJsonDownload = () => {
    if (!distributionPlan || isLoadingJson) {
      return;
    }
    fetchJson();
  };

  const handleCsvDownload = () => {
    if (!distributionPlan || isLoadingCsv) {
      return;
    }
    fetchCsv();
  };

  return (
    <div className="tw-flex tw-justify-end tw-gap-x-3">
      <RoundedJsonIconButton
        onClick={handleJsonDownload}
        loading={isLoadingJson}
      />

      <RoundedCsvIconButton
        onClick={handleCsvDownload}
        loading={isLoadingCsv}
      />
    </div>
  );
}
