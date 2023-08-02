import { useContext, useEffect } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";

import StepHeader from "../common/StepHeader";
import CreatePlanForm from "./CreatePlanForm";
import {
  AllowlistDescription,
  AllowlistToolResponse,
} from "../../allowlist-tool/allowlist-tool.types";

export default function CreatePlan() {
  const { setState } = useContext(DistributionPlanToolContext);
  useEffect(() => {
    const fetchAllowlist = async () => {
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/0f275b3f-f4c2-47d2-a4b3-7192e36c1af2`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: AllowlistToolResponse<AllowlistDescription> =
        await response.json();
      if ("error" in data) {
        return;
      }

      setState(data);
    };
    fetchAllowlist();
  }, []);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_PLAN} />
      <div className="tw-max-w-2xl tw-mx-auto tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700">
        <p className="tw-m-0 tw-block tw-text-primary-400 tw-text-lg tw-font-medium">
          Let’s Get Started
        </p>
        <CreatePlanForm />
      </div>
    </div>
  );
}
