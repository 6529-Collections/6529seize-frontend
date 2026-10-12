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
  // Allow brief SDK readiness delays without retrying indefinitely.
  const attempts = new Map<Section, number>();
  const cancel = (element: Element) => {
    clearTimeout(timers.get(element));
    timers.delete(element);
  };
  const start = (element: Element) => {
    const section = observed.get(element);
    if (
      !section ||
      seen.has(section) ||
      (attempts.get(section) ?? 0) >= 3 ||
      // Several artwork anchors can be visible; attempt the section once at a time.
      Array.from(timers.keys()).some(
        (anchor) => observed.get(anchor) === section
      ) ||
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
          (attempts.get(section) ?? 0) >= 3 ||
          element.getAttribute(attribute) !== section
        )
          return;
        attempts.set(section, (attempts.get(section) ?? 0) + 1);
        if (onSeen(section) !== false) seen.add(section);
        else start(element);
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
      for (const element of visible) start(element);
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
    for (const element of visible) start(element);
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
