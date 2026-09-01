export enum Mode {
  CONTENT = "CONTENT",
  FOLLOWERS = "FOLLOWERS",
}

export const BRAIN_RIGHT_SIDEBAR_ID = "brain-right-sidebar";
export const BRAIN_RIGHT_SIDEBAR_ENTER_TRANSITION = {
  duration: 0.22,
  ease: [0, 0, 0.2, 1],
} as const;
export const BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION = {
  duration: 0.14,
  ease: [0.4, 0, 1, 1],
} as const;
export const BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION = {
  duration: 0,
} as const;

export enum SidebarTab {
  ABOUT = "ABOUT",
  REP = "REP",
  CONFIGURATION = "CONFIGURATION",
  TOP_VOTERS = "TOP_VOTERS",
  ACTIVITY_LOG = "ACTIVITY_LOG",
}
