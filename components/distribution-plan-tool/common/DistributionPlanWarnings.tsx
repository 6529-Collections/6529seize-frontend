"use client";

import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";
import { AllowlistRunStatus } from "../../allowlist-tool/allowlist-tool.types";
import DistributionPlanErrorWarning from "./DistributionPlanErrorWarning";

export default function DistributionPlanWarnings() {
  const { operations, distributionPlan } = useContext(
    DistributionPlanToolContext
  );
  const [haveUnRunOperations, setHaveUnRunOperations] = useState(false);
  const [haveErrors, setHaveErrors] = useState(false);

  useEffect(() => {
    setHaveUnRunOperations(operations.some((operation) => !operation.hasRan));
  }, [operations]);

  useEffect(() => {
    if (!distributionPlan) return;
    const hasErrors =
      distributionPlan.activeRun?.status === AllowlistRunStatus.FAILED;
    setHaveErrors(hasErrors);
  }, [distributionPlan]);
  return <>{haveErrors && <DistributionPlanErrorWarning />}</>;
}
