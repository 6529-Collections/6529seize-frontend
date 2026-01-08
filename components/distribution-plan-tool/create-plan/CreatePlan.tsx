"use client";

import { useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import AllowlistToolLoader, {
  AllowlistToolLoaderSize,
} from "@/components/allowlist-tool/common/AllowlistToolLoader";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { makeErrorToast } from "@/services/distribution-plan.utils";
import { useRouter } from "next/navigation";
import StepHeader from "../common/StepHeader";

export default function CreatePlan({ id }: { readonly id: string }) {
  const router = useRouter();

  const { setState } = useContext(DistributionPlanToolContext);

  const {
    data: distributionPlanResponse,
    isError,
  } = useQuery({
    queryKey: ["distribution-plan", id],
    queryFn: () =>
      distributionPlanApiFetch<AllowlistDescription>(`/allowlists/${id}`),
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (id) return;

    makeErrorToast("No id found");
    setState(null);
    router.push("/emma");
  }, [id, router, setState]);

  useEffect(() => {
    if (!id) return;

    if (!distributionPlanResponse) {
      if (isError) {
        setState(null);
        router.push("/emma");
      }
      return;
    }

    if (!distributionPlanResponse.success || !distributionPlanResponse.data) {
      setState(null);
      router.push("/emma");
      return;
    }

    setState(distributionPlanResponse.data);
  }, [id, distributionPlanResponse, isError, setState, router]);

  return (
    <div>
      <StepHeader step={DistributionPlanToolStep.CREATE_PLAN} />
      <div className="tw-text-center tw-mt-12">
        <AllowlistToolLoader size={AllowlistToolLoaderSize.LARGE} />
      </div>
    </div>
  );
}
