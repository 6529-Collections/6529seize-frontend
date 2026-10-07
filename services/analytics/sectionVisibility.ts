// Shared by homepage and profile tracking. Sections count once per visit after
// one continuous second on screen; callers mark only ready content.
export function observeAnalyticsSections<Section extends string>({
  root,
  attribute,
  sections,
  onSeen,
  seen,
}: {
  readonly root: HTMLElement;
  readonly attribute: string;
  readonly sections: readonly Section[];
  readonly onSeen: (section: Section) => boolean | void;
  readonly seen: Set<Section>;
}): () => void {
  if (typeof IntersectionObserver === "undefined") return () => undefined;

  const selector = `[${attribute}]`;
  const isSection = (value: string | null): value is Section =>
    sections.some((section) => section === value);
  const observed = new Map<Element, Section>();
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
          seen.has(section) ||
          element.getAttribute(attribute) !== section
        )
          return;
        if (onSeen(section) !== false) seen.add(section);
      }, 1000)
    );
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
          visible.add(entry.target);
          start(entry.target);
        } else {
          visible.delete(entry.target);
          cancel(entry.target);
        }
      }
    },
    { threshold: 0.1 }
  );

  const syncSections = () => {
    for (const [element, section] of observed) {
      if (
        !root.contains(element) ||
        element.getAttribute(attribute) !== section
      ) {
        cancel(element);
        visible.delete(element);
        observer.unobserve(element);
        observed.delete(element);
      }
    }
    for (const element of root.querySelectorAll(selector)) {
      const section = element.getAttribute(attribute);
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
    attributeFilter: [attribute],
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
