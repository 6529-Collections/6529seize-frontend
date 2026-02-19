export const DROP_FORGE_TITLE = "Drop Forge";

export const CRAFT_CLAIMS_PAGE_SIZE = 5;

export const DROP_FORGE_SECTIONS = {
  CRAFT: {
    title: "Craft Drops",
    description: "Craft drops from winning submissions for distribution.",
    path: "/drop-forge/craft",
  },
  LAUNCH: {
    title: "Launch Drops",
    description: "Launch drops on the blockchain and run airdrops.",
    path: "/drop-forge/launch",
  },
} as const;

export type DropForgeSectionKey = keyof typeof DROP_FORGE_SECTIONS;
