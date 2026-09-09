export const MODERATION_TAB_SLUGS = {
  OPEN: "open-reports",
  RESOLVED: "resolved-reports",
  SUSPENDED: "suspended-profiles",
  BLOCK_ACTIVITY: "block-activity",
} as const;

export type ModerationTab = keyof typeof MODERATION_TAB_SLUGS;

export function getModerationTab(slug?: string): ModerationTab | null {
  if (slug === undefined) {
    return "OPEN";
  }
  return (
    (Object.keys(MODERATION_TAB_SLUGS) as ModerationTab[]).find(
      (tab) => MODERATION_TAB_SLUGS[tab] === slug
    ) ?? null
  );
}

export function getModerationTabPath(tab: ModerationTab): string {
  return `/content-moderation/${MODERATION_TAB_SLUGS[tab]}`;
}
