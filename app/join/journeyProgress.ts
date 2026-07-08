import { TIMELINE_ORDER, type TimelineStepId } from "./page.content";
import type { JoinPageState, StepStatus, TimelineProgress } from "./page.types";

const COMPLETED_STEPS: Readonly<
  Record<JoinPageState, readonly TimelineStepId[]>
> = {
  loggedOut: [],
  inProgress: ["wallet"],
  loggedIn: ["wallet", "profile", "waves"],
};

const CURRENT_STEP: Readonly<Record<JoinPageState, TimelineStepId | null>> = {
  loggedOut: "wallet",
  inProgress: "profile",
  loggedIn: null,
};

export const buildJoinJourneyProgress = (
  pageState: JoinPageState
): TimelineProgress => {
  const completedSteps = new Set(COMPLETED_STEPS[pageState]);
  const currentStepId = CURRENT_STEP[pageState];
  const total = TIMELINE_ORDER.length;
  const completed = completedSteps.size;

  return {
    completed,
    currentStepId,
    percent: Math.round((completed / total) * 100),
    statuses: Object.fromEntries(
      TIMELINE_ORDER.map((stepId) => [
        stepId,
        getStepStatus(stepId, completedSteps, currentStepId),
      ])
    ) as Readonly<Record<TimelineStepId, StepStatus>>,
    total,
    visible: pageState !== "loggedOut",
  };
};

const getStepStatus = (
  stepId: TimelineStepId,
  completedSteps: ReadonlySet<TimelineStepId>,
  currentStepId: TimelineStepId | null
): StepStatus => {
  if (completedSteps.has(stepId)) {
    return "complete";
  }

  return stepId === currentStepId ? "current" : "pending";
};
