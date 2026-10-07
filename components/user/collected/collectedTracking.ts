export const PROFILE_EVENT_NAMES = {
  sectionSeen: "Profile section seen",
  actionClicked: "Profile action clicked",
} as const;

export const COLLECTED_SECTIONS = [
  "Collection summary",
  "Collection details",
  "Filters",
  "Artwork",
] as const;

const COLLECTED_ACTIONS = [
  "Details",
  "Hide details",
  "Complete my set",
  "Manage orders",
  "Open artwork",
  "Change view",
  "Change collection",
  "Change season",
  "Change sort",
  "Change seized filter",
  "Change address",
  "Change page",
  "Show more seasons",
  "Show fewer seasons",
] as const;

export type CollectedSection = (typeof COLLECTED_SECTIONS)[number];
export type CollectedAction = (typeof COLLECTED_ACTIONS)[number];

// Read fixed annotations, never button text, artwork names or destination URLs.
export function getCollectedClick(
  root: HTMLElement,
  target: EventTarget | null
) {
  if (!(target instanceof Element)) return null;
  const control = target.closest("a,button,summary");
  if (
    !(control instanceof HTMLElement) ||
    !root.contains(control) ||
    control.matches(':disabled, [aria-disabled="true"]')
  )
    return null;
  const action = control
    .closest("[data-profile-action]")
    ?.getAttribute("data-profile-action");
  const section = control
    .closest("[data-profile-section]")
    ?.getAttribute("data-profile-section");
  const approvedAction = COLLECTED_ACTIONS.find((value) => value === action);
  const approvedSection = COLLECTED_SECTIONS.find((value) => value === section);
  return approvedAction && approvedSection
    ? { section: approvedSection, action: approvedAction }
    : null;
}
