import { observeAnalyticsSections } from "@/services/analytics/sectionVisibility";

export const HOMEPAGE_EVENT_NAMES = {
  sectionSeen: "Homepage section seen",
  actionClicked: "Homepage action clicked",
} as const;

const HOMEPAGE_SECTIONS = [
  "Introduction",
  "Get started",
  "Latest drop",
  "Next drop",
  "About 6529",
  "Coming up",
  "Boosted drops",
  "Explore waves",
] as const;

const HOMEPAGE_ACTIONS = [
  "Open network health",
  "Get started",
  "Connect wallet",
  "Open artwork",
  "Open artist profile",
  "Toggle edition details",
  "View distribution plan",
  "Mint",
  "Manage subscriptions",
  "About subscriptions",
  "View all",
  "Open drop",
  "Open wave",
] as const;

export type HomepageSection = (typeof HOMEPAGE_SECTIONS)[number];
type HomepageAction = (typeof HOMEPAGE_ACTIONS)[number];

const SECTION_ATTRIBUTE = "data-home-section";
const SECTION_SELECTOR = `[${SECTION_ATTRIBUTE}]`;

function isSection(value: string | null): value is HomepageSection {
  return HOMEPAGE_SECTIONS.some((section) => section === value);
}

function isAction(value: string | null): value is HomepageAction {
  return HOMEPAGE_ACTIONS.some((action) => action === value);
}

export function getHomepageClick(
  root: HTMLElement,
  target: EventTarget | null
) {
  if (!(target instanceof Element)) return null;
  const control = target.closest("a,button,summary");
  if (
    !(control instanceof HTMLElement) ||
    !root.contains(control) ||
    control.matches(":disabled")
  ) {
    return null;
  }
  const action = control.dataset["homeAction"] ?? null;
  const section =
    control.closest(SECTION_SELECTOR)?.getAttribute(SECTION_ATTRIBUTE) ?? null;
  if (!isAction(action) || !isSection(section)) return null;
  return { section, action };
}

// Observe the mounted homepage only. Shared cards elsewhere never start tracking.
export function observeHomepageSections(
  root: HTMLElement,
  onSeen: (section: HomepageSection) => void,
  seen: Set<HomepageSection>
): () => void {
  return observeAnalyticsSections({
    root,
    attribute: SECTION_ATTRIBUTE,
    sections: HOMEPAGE_SECTIONS,
    onSeen,
    seen,
  });
}
