"use client";

import { useContext, useEffect } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";

import { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import AllowlistToolLoader, {
  AllowlistToolLoaderSize,
} from "@/components/allowlist-tool/common/AllowlistToolLoader";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { useRouter } from "next/navigation";
import StepHeader from "../common/StepHeader";

export default function CreatePlan({ id }: { readonly id: string }) {
  const router = useRouter();

  const { setState } = useContext(DistributionPlanToolContext);
  useEffect(() => {
    if (!id) {
      alert("No id found");
      router.push("/emma");
      return;
    }
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
