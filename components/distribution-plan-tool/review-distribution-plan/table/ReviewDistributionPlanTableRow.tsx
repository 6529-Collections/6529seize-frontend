import { useContext, useState } from "react";
import AllowlistToolJsonIcon from "../../../allowlist-tool/icons/AllowlistToolJsonIcon";
import DistributionPlanTableRowWrapper from "../../common/DistributionPlanTableRowWrapper";
import {
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

  const fetchResults = async () => {
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

      downloadResults(data);
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
    <DistributionPlanTableRowWrapper>
      <td
        className={`tw-whitespace-nowrap tw-py-4 tw-pr-3 tw-text-sm  tw-text-white  ${
          item.type === ReviewDistributionPlanTableItemType.COMPONENT
            ? "tw-pl-8 sm:tw-pl-12 tw-font-light"
            : "tw-pl-4 sm:tw-pl-6 tw-font-medium"
        }`}
      >
        {item.name}
      </td>
      <td
        className={`tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-text-neutral-300 ${
          item.type === ReviewDistributionPlanTableItemType.COMPONENT
            ? "tw-font-light"
            : "tw-font-normal"
        }`}
      >
        {item.description}
      </td>
      <td
        className={`tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-text-neutral-300 ${
          item.type === ReviewDistributionPlanTableItemType.COMPONENT
            ? "tw-font-light"
            : "tw-font-normal"
        }`}
      >
        {item.walletsCount}
      </td>
      <td
        className={`tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-text-neutral-300 ${
          item.type === ReviewDistributionPlanTableItemType.COMPONENT
            ? "tw-font-light"
            : "tw-font-normal"
        }`}
      >
        {item.tokensCount}
      </td>
      <td
        className={`tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-sm tw-text-neutral-300 ${
          item.type === ReviewDistributionPlanTableItemType.COMPONENT
            ? "tw-font-light"
            : "tw-font-normal"
        }`}
      >
        <button
          onClick={fetchResults}
          type="button"
          className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
        >
          <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center">
            <AllowlistToolJsonIcon />
          </div>
        </button>
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
