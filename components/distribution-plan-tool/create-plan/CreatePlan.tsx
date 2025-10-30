"use client";

import { useContext, useEffect, useEffectEvent } from "react";
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

  const redirectToEmma = useEffectEvent(() => {
    router.push("/emma");
  });

  const applyDistributionPlan = useEffectEvent(
    (distributionPlan: AllowlistDescription) => {
      void setState(distributionPlan);
    }
  );

  useEffect(() => {
    if (!id) {
      alert("No id found");
      redirectToEmma();
      return;
    }

    let isActive = true;

    const fetchAllowlist = async () => {
      try {
        const response = await distributionPlanApiFetch<AllowlistDescription>(
          `/allowlists/${id}`
        );

        if (!isActive) return;

        if (!response.success || !response.data) {
          redirectToEmma();
          return;
        }

        applyDistributionPlan(response.data);
      } catch {
        if (isActive) {
          redirectToEmma();
        }
      }
    };

    fetchAllowlist();

    return () => {
      isActive = false;
    };
  }, [id, applyDistributionPlan, redirectToEmma]);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_PLAN} />
      <div className="tw-text-center tw-mt-12">
        <AllowlistToolLoader size={AllowlistToolLoaderSize.LARGE} />
      </div>
    </div>
  );
}
