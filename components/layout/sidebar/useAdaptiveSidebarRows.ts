import { useLayoutEffect, useRef } from "react";

export function useAdaptiveSidebarRows(enabled: boolean) {
  const sectionsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sections = sectionsRef.current;
    if (!enabled || !sections || typeof ResizeObserver === "undefined") return;

    const nav = sections.querySelector("[data-sidebar-scroll] > nav");
    const utilities = sections.querySelector(
      '[data-sidebar-section="utilities"]'
    );
    const account = sections.querySelector('[data-sidebar-section="account"]');
    const profile = account?.lastElementChild;
    if (!nav?.firstElementChild || !utilities || !account || !profile) return;
    const navItems = nav.firstElementChild;

    const updateRowHeight = () => {
      // Count the rows the controls actually render, including the Share
      // loading placeholder. An empty Update wrapper takes no space.
      const rowCount =
        navItems.childElementCount +
        utilities.querySelectorAll(":scope > :not(:empty)").length +
        (account.childElementCount - 1);
      if (rowCount === 0) return;

      const availableHeight =
        sections.getBoundingClientRect().height -
        profile.getBoundingClientRect().height -
        Number.parseFloat(getComputedStyle(nav).paddingTop) -
        Number.parseFloat(getComputedStyle(account).paddingTop);
      // Round down so rounding across rows cannot clip the last one.
      const fittingHeight = Math.floor(availableHeight / rowCount);
      const rowHeight = `clamp(2.625rem, ${fittingHeight}px, 2.875rem)`;
      if (
        sections.style.getPropertyValue("--sidebar-row-height") !== rowHeight
      ) {
        sections.style.setProperty("--sidebar-row-height", rowHeight);
      }
    };

    updateRowHeight();
    let frame = 0;
    const observer = new ResizeObserver(() => {
      // Updating the rows changes the observed sizes. Apply it on the next
      // frame so the observer never writes during its own delivery cycle.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateRowHeight);
    });
    for (const element of [sections, nav, utilities, account]) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      sections.style.removeProperty("--sidebar-row-height");
    };
  }, [enabled]);

  return sectionsRef;
}
