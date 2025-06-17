"use client";

import { useEffect, useState } from "react";
import DistributionPlanStepDone from "./DistributionPlanStepDone";
import { DistributionPlanStepDescription } from "./DistributionPlanToolSidebar";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import DistributionPlanStepCurrent from "./DistributionPlanStepCurrent";
import DistributionPlanStepUpcoming from "./DistributionPlanStepUpcoming";

interface DistributionPlanStepProps {
  step: DistributionPlanStepDescription;
  activeStepOrder: number;
}

enum StepStatus {
  DONE = "DONE",
  CURRENT = "CURRENT",
  UPCOMING = "UPCOMING",
}

export default function DistributionPlanStep({
  step,
  activeStepOrder,
}: DistributionPlanStepProps) {
  const [stepStatus, setStepStatus] = useState<StepStatus>(StepStatus.UPCOMING);
  useEffect(() => {
    if (step.order === activeStepOrder) {
      setStepStatus(StepStatus.CURRENT);
    } else if (step.order < activeStepOrder) {
      setStepStatus(StepStatus.DONE);
    } else {
      setStepStatus(StepStatus.UPCOMING);
    }
  }, [activeStepOrder, step.order]);

  switch (stepStatus) {
    case StepStatus.DONE:
      return <DistributionPlanStepDone step={step} />;
    case StepStatus.CURRENT:
      return <DistributionPlanStepCurrent step={step} />;
    case StepStatus.UPCOMING:
      return <DistributionPlanStepUpcoming step={step} />;
    default:
      assertUnreachable(stepStatus);
      return null;
  }
}
