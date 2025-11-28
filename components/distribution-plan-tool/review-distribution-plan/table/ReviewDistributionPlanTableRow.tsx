"use client";

import { AllowlistResult } from "@/components/allowlist-tool/allowlist-tool.types";
import DistributionPlanTableRowWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableRowWrapper";
import RoundedCsvIconButton from "@/components/distribution-plan-tool/common/RoundedCsvIconButton";
import RoundedJsonIconButton from "@/components/distribution-plan-tool/common/RoundedJsonIconButton";
import RoundedManifoldIconButton from "@/components/distribution-plan-tool/common/RoundedManifoldIconButton";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { useContext, useEffect, useState } from "react";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "./constants";
import {
  FetchResultsType,
  FullResultWallet,
  ReviewDistributionPlanTableItem,
  ReviewDistributionPlanTableItemType,
  ReviewDistributionPlanTablePhase,
} from "./ReviewDistributionPlanTable";
import { SubscriptionLinks } from "./ReviewDistributionPlanTableSubscription";

export default function ReviewDistributionPlanTableRow({
  item,
  rows,
}: {
  readonly item: ReviewDistributionPlanTableItem;
  readonly rows: ReviewDistributionPlanTablePhase[];
}) {
  const { distributionPlan } = useContext(DistributionPlanToolContext);

  const [loadingType, setLoadingType] = useState<FetchResultsType | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [isLoadingManifold, setIsLoadingManifold] = useState(false);

  useEffect(() => {
    setIsLoadingJson(loadingType === FetchResultsType.JSON);
    setIsLoadingCsv(loadingType === FetchResultsType.CSV);
    setIsLoadingManifold(loadingType === FetchResultsType.MANIFOLD);
  }, [loadingType]);

  const getEndpoint = (distributionPlanId: string): string => {
    switch (item.type) {
      case ReviewDistributionPlanTableItemType.PHASE:
        return `/allowlists/${distributionPlanId}/results/phases/${item.phaseId}`;
      case ReviewDistributionPlanTableItemType.COMPONENT:
        return `/allowlists/${distributionPlanId}/results/phases/${item.phaseId}/components/${item.componentId}`;
      default:
        assertUnreachable(item.type);
        return "";
    }
  };

  const getFileName = (extension: string) =>
    `${item.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}.${extension}`;

  const getFullResults = (results: AllowlistResult[]): FullResultWallet[] =>
    results.map<FullResultWallet>((result) => {
      const phase = rows.find((row) => row.phase.id === result.phaseId);
      const component = phase?.components.find(
        (component) => component.id === result.phaseComponentId
      );
      return {
        ...result,
        phaseName: phase?.phase.name ?? "",
        componentName: component?.name ?? "",
      };
    });

  const downloadJson = (results: AllowlistResult[]) => {
    const data = JSON.stringify(getFullResults(results));
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getFileName("json");
    link.click();
  };

  const downloadCsv = (results: AllowlistResult[]) => {
    const fullResult = getFullResults(results);
    const csv = [
      Object.keys(fullResult[0]).join(","),
      ...fullResult.map((item) => Object.values(item).join(",")),
    ].join("\n");

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = getFileName("csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mergeAddressValues = (
    results: { address: string; value: number }[]
  ): { address: string; value: number }[] => {
    const merged = results.reduce<{ [address: string]: number }>(
      (acc, result) => {
        const address = result.address.toLowerCase();
        if (acc[address]) {
          acc[address] += result.value;
        } else {
          acc[address] = result.value;
        }
        return acc;
      },
      {}
    );
    return Object.keys(merged).map<{ address: string; value: number }>(
      (address) => ({ address, value: merged[address] })
    );
  };

  const downloadManifold = (results: AllowlistResult[]) => {
    const fullResult = getFullResults(results).map<{
      address: string;
      value: number;
    }>((row) => ({
      address: row.wallet,
      value: row.amount,
    }));
    const csv = [
      Object.keys(fullResult[0]).join(","),
      ...mergeAddressValues(fullResult).map((item) =>
        Object.values(item).join(",")
      ),
    ].join("\n");

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = getFileName("csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchResults = async (fetchType: FetchResultsType) => {
    if (!distributionPlan) return;
    if (loadingType) return;
    setLoadingType(fetchType);
    const endpoint = getEndpoint(distributionPlan.id);
    const { success, data } = await distributionPlanApiFetch<AllowlistResult[]>(
      endpoint
    );
    setLoadingType(null);
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
        downloadManifold(data);
        break;
      default:
        assertUnreachable(fetchType);
    }
  };

  const [nameClasses, setNameClasses] = useState<string>(
    "tw-whitespace-nowrap tw-py-4 tw-pr-3 tw-text-sm tw-text-white tw-pl-8 sm:tw-pl-12 tw-font-light"
  );
  const [commonClasses, setCommonClasses] = useState<string>(
    "tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-text-white tw-font-light"
  );
  useEffect(() => {
    if (item.type === ReviewDistributionPlanTableItemType.COMPONENT) {
      setNameClasses(
        "tw-whitespace-nowrap tw-py-4 tw-pr-3 tw-text-sm  tw-text-white tw-pl-8 sm:tw-pl-12 tw-font-light"
      );
      setCommonClasses(
        "tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-4 tw-text-sm tw-text-iron-300 tw-font-light"
      );
    } else {
      setNameClasses(
        "tw-whitespace-nowrap tw-py-4 tw-pr-3 tw-text-sm tw-text-iron-50 tw-pl-4 sm:tw-pl-6 tw-font-bold"
      );
      setCommonClasses(
        "tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-4 tw-text-sm tw-text-iron-50 tw-font-bold"
      );
    }
  }, [item.type]);

  const isPublic = item.phaseId === PUBLIC_SUBSCRIPTIONS_PHASE_ID;

  return (
    <DistributionPlanTableRowWrapper>
      <td className={nameClasses}>{item.name}</td>
      <td className={commonClasses}>{item.description}</td>
      <td className={commonClasses}>{isPublic ? "-" : item.walletsCount}</td>
      <td className={commonClasses}>{isPublic ? "-" : item.spotsCount}</td>
      <td className={`${commonClasses} tw-flex tw-justify-start tw-gap-x-3`}>
        <RoundedJsonIconButton
          onClick={() => fetchResults(FetchResultsType.JSON)}
          loading={isLoadingJson}
          disabled={isPublic}
        />
        <RoundedCsvIconButton
          onClick={() => fetchResults(FetchResultsType.CSV)}
          loading={isLoadingCsv}
          disabled={isPublic}
        />
        <RoundedManifoldIconButton
          onClick={() => fetchResults(FetchResultsType.MANIFOLD)}
          loading={isLoadingManifold}
          disabled={isPublic}
        />
        {distributionPlan && (
          <SubscriptionLinks plan={distributionPlan} phase={item} />
        )}
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
