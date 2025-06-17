"use client";

import { useContext, useEffect } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";

import StepHeader from "../common/StepHeader";
import { AllowlistDescription } from "../../allowlist-tool/allowlist-tool.types";
import AllowlistToolLoader, {
  AllowlistToolLoaderSize,
} from "../../allowlist-tool/common/AllowlistToolLoader";
import { useRouter } from "next/router";
import { distributionPlanApiFetch } from "../../../services/distribution-plan-api";

export default function CreatePlan() {
  const router = useRouter();

  const { setState } = useContext(DistributionPlanToolContext);
  useEffect(() => {
    const { id } = router.query;
    const fetchAllowlist = async () => {
      const data = await distributionPlanApiFetch<AllowlistDescription>(
        `/allowlists/${id}`
      );
      if (!data.success) {
        router.push("/emma");
        return;
      }
      setState(data.data);
    };
    fetchAllowlist();
  }, []);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_PLAN} />
      <div className="tw-text-center tw-mt-12">
        <AllowlistToolLoader size={AllowlistToolLoaderSize.LARGE} />
      </div>
    </div>
  );
}
