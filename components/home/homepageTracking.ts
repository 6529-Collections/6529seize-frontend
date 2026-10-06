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
const VISIBLE_RATIO = 0.1;
const VISIBLE_MS = 1000;

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
  if (typeof IntersectionObserver === "undefined") return () => undefined;

  const observed = new Map<Element, HomepageSection>();
  const visible = new Set<Element>();
  const timers = new Map<Element, ReturnType<typeof setTimeout>>();
  const cancel = (element: Element) => {
    clearTimeout(timers.get(element));
    timers.delete(element);
  };
  const start = (element: Element) => {
    const section = observed.get(element);
    if (
      !section ||
      seen.has(section) ||
      timers.has(element) ||
      document.visibilityState !== "visible"
    )
      return;
    timers.set(
      element,
      setTimeout(() => {
        timers.delete(element);
        if (
          !root.contains(element) ||
          !visible.has(element) ||
          document.visibilityState !== "visible" ||
          seen.has(section)
        )
          return;
        if (element.getAttribute(SECTION_ATTRIBUTE) !== section) return;
        seen.add(section);
        onSeen(section);
      }, VISIBLE_MS)
    );
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO) {
          visible.add(entry.target);
          start(entry.target);
        } else {
          visible.delete(entry.target);
          cancel(entry.target);
        }
      }
    },
    { threshold: VISIBLE_RATIO }
  );

  const syncSections = () => {
    for (const [element, section] of observed) {
      if (
        !root.contains(element) ||
        element.getAttribute(SECTION_ATTRIBUTE) !== section
      ) {
        cancel(element);
        visible.delete(element);
        observer.unobserve(element);
        observed.delete(element);
      }
    }
    for (const element of root.querySelectorAll(SECTION_SELECTOR)) {
      const section = element.getAttribute(SECTION_ATTRIBUTE);
      if (isSection(section) && !observed.has(element)) {
        observed.set(element, section);
        observer.observe(element);
      }
    }
  };
  const onVisibilityChange = () => {
    for (const element of visible) {
      cancel(element);
      if (document.visibilityState === "visible") start(element);
    }
  };
  const mutations = new MutationObserver(syncSections);
  mutations.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [SECTION_ATTRIBUTE],
  });
  syncSections();
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    observer.disconnect();
    mutations.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    for (const element of timers.keys()) cancel(element);
  };
}
