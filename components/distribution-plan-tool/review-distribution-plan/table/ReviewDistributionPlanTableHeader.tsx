"use client";

import type { AllowlistResult } from "@/components/allowlist-tool/allowlist-tool.types";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { buildCsvFromRecords } from "@/helpers/csv-export.helpers";
import { downloadJsonFile } from "@/helpers/json-download.helpers";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { useContext, useState } from "react";
import type {
  FullResultWallet,
  ReviewDistributionPlanTablePhase,
} from "./ReviewDistributionPlanTable.types";
import { FetchResultsType } from "./ReviewDistributionPlanTable.types";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/emma";
import { ReviewDistributionExports } from "./ReviewDistributionExports";

const heading =
  "tw-px-2 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-iron-300 sm:tw-px-3";

export default function ReviewDistributionPlanTableHeader({
  rows,
}: {
  rows: ReviewDistributionPlanTablePhase[];
}) {
  const { distributionPlan } = useContext(DistributionPlanToolContext);
  const [loadingType, setLoadingType] = useState<FetchResultsType | null>(null);
  const locale = useBrowserLocale();

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
    downloadJsonFile(data, "results.json");
  };

  const downloadCsv = (results: AllowlistResult[]) => {
    const csv = buildCsvFromRecords(getFullResults(results));

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = "data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadManifold = (results: AllowlistResult[]) => {
    const fullResult = getFullResults(results).map<{
      address: string;
      value: number;
    }>((row) => ({
      address: row.wallet,
      value: row.amount,
    }));
    const csv = buildCsvFromRecords(fullResult);

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
    const endpoint = `/allowlists/${distributionPlan.id}/results`;
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
  return (
    <thead className="tw-bg-iron-800">
      <tr>
        <th scope="col" className={heading}>
          {t(locale, "emma.review.name")}
        </th>
        <th scope="col" className={heading}>
          {t(locale, "emma.review.wallets")}
        </th>
        <th scope="col" className={heading}>
          {t(locale, "emma.review.spots")}
        </th>
        <th
          scope="col"
          aria-label={t(locale, "emma.review.exports")}
          className="tw-px-2 tw-py-2 sm:tw-px-3"
        >
          <ReviewDistributionExports
            loading={loadingType}
            onExport={(type) => void fetchResults(type)}
          />
        </th>
      </tr>
    </thead>
  );
}
