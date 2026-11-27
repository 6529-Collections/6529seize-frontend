"use client";

import { useContext, useState } from "react";
import type { AllowlistResult } from "@/components/allowlist-tool/allowlist-tool.types";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { buildCsvFromRecords } from "@/helpers/csv-export.helpers";
import { downloadJsonFile } from "@/helpers/json-download.helpers";
import { formatCount } from "@/helpers/format.helpers";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { PUBLIC_SUBSCRIPTIONS_PHASE_ID } from "./constants";
import {
  FetchResultsType,
  ReviewDistributionPlanTableItemType,
} from "./ReviewDistributionPlanTable.types";
import { SubscriptionLinks } from "./ReviewDistributionPlanTableSubscription";
import type {
  FullResultWallet,
  ReviewDistributionPlanTableItem,
  ReviewDistributionPlanTablePhase,
} from "./ReviewDistributionPlanTable.types";

import { ReviewDistributionExports } from "./ReviewDistributionExports";

export default function ReviewDistributionPlanTableRow({
  item,
  rows,
  showManual = false,
}: {
  readonly item: ReviewDistributionPlanTableItem;
  readonly rows: ReviewDistributionPlanTablePhase[];
  readonly showManual?: boolean;
}) {
  const { distributionPlan } = useContext(DistributionPlanToolContext);

  const [loadingType, setLoadingType] = useState<FetchResultsType | null>(null);
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
    downloadJsonFile(data, getFileName("json"));
  };

  const downloadCsv = (results: AllowlistResult[]) => {
    const fullResult = getFullResults(results);
    const csv = buildCsvFromRecords(fullResult);

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
      (address) => ({ address, value: merged[address]! })
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
    const csv = buildCsvFromRecords(mergeAddressValues(fullResult));

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
    const { success, data } =
      await distributionPlanApiFetch<AllowlistResult[]>(endpoint);
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

  const isPublic = item.phaseId === PUBLIC_SUBSCRIPTIONS_PHASE_ID;
  const isComponent =
    item.type === ReviewDistributionPlanTableItemType.COMPONENT;
  const description = item.description.trim();
  const cell = `tw-px-2 tw-py-2 tw-align-middle tw-text-sm sm:tw-px-3 ${isComponent ? "tw-text-iron-300" : "tw-font-semibold tw-text-iron-100"}`;

  return (
    <tr>
      <th
        scope="row"
        className={`${cell} tw-break-words tw-text-left [overflow-wrap:anywhere] ${isComponent ? "tw-pl-3 tw-font-normal sm:tw-pl-5" : ""}`}
      >
        {item.name}
        {description && description !== item.name.trim() && (
          <span className="tw-mt-0.5 tw-block tw-text-xs tw-font-normal tw-text-iron-400">
            {description}
          </span>
        )}
      </th>
      <td className={`${cell} tw-break-words tw-tabular-nums`}>
        {isPublic ? "—" : formatCount(item.walletsCount)}
      </td>
      <td className={`${cell} tw-break-words tw-tabular-nums`}>
        {isPublic ? "—" : formatCount(item.spotsCount)}
      </td>
      <td className={cell}>
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
          <ReviewDistributionExports
            name={item.name}
            loading={loadingType}
            onExport={(type) => void fetchResults(type)}
            disabled={isPublic}
          />
          {distributionPlan && (
            <SubscriptionLinks
              plan={distributionPlan}
              phase={item}
              showManual={showManual}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
