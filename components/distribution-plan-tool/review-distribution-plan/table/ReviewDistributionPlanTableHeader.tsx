import { useContext, useState } from "react";
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

export default function ReviewDistributionPlanTableHeader({
  rows,
}: {
  rows: ReviewDistributionPlanTablePhase[];
}) {
  const { distributionPlan, setToasts } = useContext(
    DistributionPlanToolContext
  );
  const [isLoading, setIsLoading] = useState(false);

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

  const downloadResults = (results: AllowlistResult[]) => {
    const fullResult: FullResultWallet[] = results.map<FullResultWallet>(
      (result) => {
        const phase = rows.find((row) => row.phase.id === result.phaseId);
        const component = phase?.components.find(
          (component) => component.id === result.phaseComponentId
        );
        return {
          ...result,
          phaseName: phase?.phase.name ?? "",
          componentName: component?.name ?? "",
        };
      }
    );
    const data = JSON.stringify(fullResult);
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "results.json";
    link.click();
  };

  const fetchResults = async (fetchType: FetchResultsType) => {
    if (!distributionPlan) return;
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/results`;
    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: AllowlistToolResponse<AllowlistResult[]> =
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
    <DistributionPlanTableHeaderWrapper>
      <th
        scope="col"
        className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
      >
        Name
      </th>

      <th
        scope="col"
        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
      >
        Description
      </th>
      <th
        scope="col"
        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
      >
        Wallets
      </th>
      <th
        scope="col"
        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
      >
        Spots
      </th>
      <th
        scope="col"
        className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] tw-inline-flex"
      >
        <button
          onClick={() => fetchResults(FetchResultsType.JSON)}
          type="button"
          className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
        >
          <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center">
            <AllowlistToolJsonIcon />
          </div>
        </button>
        <button
          onClick={() => fetchResults(FetchResultsType.CSV)}
          type="button"
          className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
        >
          <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center">
            <AllowlistToolCsvIcon />
          </div>
        </button>
      </th>
    </DistributionPlanTableHeaderWrapper>
  );
}
