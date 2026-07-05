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

export interface CurrentPanelContent {
  readonly title: string;
  readonly body: string;
  readonly action?: CurrentPanelAction;
  readonly error?: string | null;
}

export type StepStatus = "complete" | "current" | "pending";

export interface TimelineProgress {
  readonly visible: boolean;
  readonly completed: number;
  readonly total: number;
  readonly percent: number;
  readonly statuses: Readonly<Record<TimelineStepId, StepStatus>>;
}
