import type { TimelineStepId } from "./page.content";

export interface CurrentPanelAction {
  readonly kind: "button" | "link";
  readonly label: string;
  readonly href?: string;
  readonly busy?: boolean;
  readonly busyLabel?: string;
  readonly onClick?: () => void;
  readonly onNavigate?: () => void;
}

export type JoinPageState = "loggedOut" | "inProgress" | "loggedIn";
export type StepStatus = "complete" | "current" | "pending";

export interface TimelineProgress {
  readonly visible: boolean;
  readonly completed: number;
  readonly currentStepId: TimelineStepId | null;
  readonly total: number;
  readonly percent: number;
  readonly statuses: Readonly<Record<TimelineStepId, StepStatus>>;
}
