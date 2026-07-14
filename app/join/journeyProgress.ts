import { TIMELINE_ORDER, type TimelineStepId } from "./page.content";
import type { JoinPageState, StepStatus, TimelineProgress } from "./page.types";
import type { Join6529Facts } from "./journeyFacts";

const BASE_COMPLETED_STEPS: Readonly<
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
  pageState: JoinPageState,
  facts: Join6529Facts
): TimelineProgress => {
  const completedSteps = new Set(BASE_COMPLETED_STEPS[pageState]);
  if (pageState === "loggedIn") {
    if (facts.hasParticipated) {
      completedSteps.add("message");
    }
    if (facts.hasCollected) {
      completedSteps.add("collect");
    }
  }
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
