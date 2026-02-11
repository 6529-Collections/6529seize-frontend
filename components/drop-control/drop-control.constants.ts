export const DROP_CONTROL_TITLE = "Drop Control";

export const PREPARE_CLAIMS_PAGE_SIZE = 10;

export const DROP_CONTROL_SECTIONS = {
  PREPARE: {
    title: "Prepare Drops",
    description: "Prepare drops from winning submissions for distribution.",
    path: "/drop-control/prepare",
  },
  LAUNCH: {
    title: "Launch Drops",
    description: "Launch drops on the blockchain and run airdrops.",
    path: "/drop-control/launch",
  },
} as const;

export type DropControlSectionKey = keyof typeof DROP_CONTROL_SECTIONS;
