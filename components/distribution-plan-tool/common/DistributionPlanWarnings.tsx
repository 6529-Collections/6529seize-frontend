"use client";

import { useContext } from "react";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";
import { AllowlistRunStatus } from "@/components/allowlist-tool/allowlist-tool.types";
import DistributionPlanErrorWarning from "./DistributionPlanErrorWarning";

export default function DistributionPlanWarnings() {
  const { distributionPlan } = useContext(DistributionPlanToolContext);

  const hasErrors =
    distributionPlan?.activeRun?.status === AllowlistRunStatus.FAILED;

  return <>{hasErrors && <DistributionPlanErrorWarning />}</>;
}
