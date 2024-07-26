import { useContext, useEffect, useState } from "react";
import AllowlistToolJsonIcon from "../../../allowlist-tool/icons/AllowlistToolJsonIcon";
import DistributionPlanTableHeaderWrapper from "../../common/DistributionPlanTableHeaderWrapper";
import {
  FetchResultsType,
  FullResultWallet,
  ReviewDistributionPlanTablePhase,
} from "./ReviewDistributionPlanTable";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  AllowlistResult,
  AllowlistToolResponse,
} from "../../../allowlist-tool/allowlist-tool.types";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import AllowlistToolCsvIcon from "../../../allowlist-tool/icons/AllowlistToolCsvIcon";
import RoundedJsonIconButton from "../../common/RoundedJsonIconButton";
import RoundedCsvIconButton from "../../common/RoundedCsvIconButton";
import RoundedManifoldIconButton from "../../common/RoundedManifoldIconButton";
import { distributionPlanApiFetch } from "../../../../services/distribution-plan-api";

export default function ReviewDistributionPlanTableHeader({
  rows,
}: {
  rows: ReviewDistributionPlanTablePhase[];
}) {
  const { distributionPlan, setToasts } = useContext(
    DistributionPlanToolContext
  );
  const [loadingType, setLoadingType] = useState<FetchResultsType | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [isLoadingManifold, setIsLoadingManifold] = useState(false);

  useEffect(() => {
    setIsLoadingJson(loadingType === FetchResultsType.JSON);
    setIsLoadingCsv(loadingType === FetchResultsType.CSV);
    setIsLoadingManifold(loadingType === FetchResultsType.MANIFOLD);
  }, [loadingType]);

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
    link.download = "results.json";
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
    const csv = [
      Object.keys(fullResult[0]).join(","),
      ...fullResult.map((item) => Object.values(item).join(",")),
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
    const endpoint = `/allowlists/${distributionPlan.id}/results`;
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
  return (
    <DistributionPlanTableHeaderWrapper>
      <th
        scope="col"
        className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6">
        Name
      </th>

      <th
        scope="col"
        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
        Description
      </th>
      <th
        scope="col"
        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
        Wallets
      </th>
      <th
        scope="col"
        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
        Spots
      </th>
      <th
        scope="col"
        className="tw-pl-3 tw-pr-4 tw-py-3 tw-gap-x-3 tw-whitespace-nowrap tw-flex tw-justify-start">
        <RoundedJsonIconButton
          onClick={() => fetchResults(FetchResultsType.JSON)}
          loading={isLoadingJson}
        />
        <RoundedCsvIconButton
          onClick={() => fetchResults(FetchResultsType.CSV)}
          loading={isLoadingCsv}
        />
        <RoundedManifoldIconButton
          onClick={() => fetchResults(FetchResultsType.MANIFOLD)}
          loading={isLoadingManifold}
        />
      </th>
    </DistributionPlanTableHeaderWrapper>
  );
}
