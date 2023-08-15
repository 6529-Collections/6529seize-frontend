import { useContext, useEffect, useState } from "react";
import AllowlistToolJsonIcon from "../../../allowlist-tool/icons/AllowlistToolJsonIcon";
import DistributionPlanTableRowWrapper from "../../common/DistributionPlanTableRowWrapper";
import {
  FetchResultsType,
  FullResultWallet,
  ReviewDistributionPlanTableItem,
  ReviewDistributionPlanTableItemType,
  ReviewDistributionPlanTablePhase,
} from "./ReviewDistributionPlanTable";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import {
  AllowlistResult,
  AllowlistToolResponse,
} from "../../../allowlist-tool/allowlist-tool.types";
import AllowlistToolCsvIcon from "../../../allowlist-tool/icons/AllowlistToolCsvIcon";

export default function ReviewDistributionPlanTableRow({
  item,
  rows,
}: {
  item: ReviewDistributionPlanTableItem;
  rows: ReviewDistributionPlanTablePhase[];
}) {
  const { distributionPlan, setToasts } = useContext(
    DistributionPlanToolContext
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getUrl = (distributionPlanId: string): string => {
    switch (item.type) {
      case ReviewDistributionPlanTableItemType.PHASE:
        return `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/results/phases/${item.phaseId}`;
      case ReviewDistributionPlanTableItemType.COMPONENT:
        return `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/results/phases/${item.phaseId}/components/${item.componentId}`;
      default:
        assertUnreachable(item.type);
        return "";
    }
  };

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

  const fetchResults = async (fetchType: FetchResultsType) => {
    if (!distributionPlan) return;
    const url = getUrl(distributionPlan.id);
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
        "tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-4 tw-text-sm tw-text-neutral-300 tw-font-light"
      );
    } else {
      setNameClasses(
        "tw-whitespace-nowrap tw-py-4 tw-pr-3 tw-text-sm tw-text-neutral-50 tw-pl-4 sm:tw-pl-6 tw-font-bold"
      );
      setCommonClasses(
        "tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-4 tw-text-sm tw-text-neutral-50 tw-font-bold"
      );
    }
  }, [item.type]);

  return (
    <DistributionPlanTableRowWrapper>
      <td className={nameClasses}>{item.name}</td>
      <td className={commonClasses}>{item.description}</td>
      <td className={commonClasses}>{item.walletsCount}</td>
      <td className={commonClasses}>{item.spotsCount}</td>
      <td className={`${commonClasses} tw-flex tw-justify-end tw-gap-x-3`}>
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
        <button
          type="button"
          className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20 hover:tw-bg-neutral-400/20 tw-ease-out tw-transition tw-duration-300"
        >
          <div className="tw-flex tw-items-center tw-justify-center">
            <svg
              className="tw-h-4 tw-w-4"
              viewBox="0 0 400 192"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 0.0170752L65.3367 65.3537L297.894 65.3419L233.67 129.566L202.395 98.2916H100.296L193.519 191.515H295.618L262.661 158.558H306.777L399.998 65.3367H400L399.999 65.3356L400 65.3346H399.998L334.663 0L0 0.0170752Z"
                fill="white"
              />
            </svg>
          </div>
        </button>
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
