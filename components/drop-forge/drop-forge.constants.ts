export const DROP_FORGE_TITLE = "Drop Forge";
export const DROP_FORGE_PATH = "/drop-forge";

export const CRAFT_CLAIMS_PAGE_SIZE = 5;

export const DROP_FORGE_SECTIONS = {
  CRAFT: {
    title: "Craft Claims",
    description: "Craft claims from winning submissions for distribution.",
    path: `${DROP_FORGE_PATH}/craft`,
  },
  LAUNCH: {
    title: "Launch Claims",
    description: "Launch claims on the blockchain and run airdrops.",
    path: `${DROP_FORGE_PATH}/launch`,
  },
} as const;

export type DropForgeSectionKey = keyof typeof DROP_FORGE_SECTIONS;
