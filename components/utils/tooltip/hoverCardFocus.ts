const TAB_STOP_SELECTOR =
  "a[href],button,input,select,textarea,[tabindex],[contenteditable='true']";

/** Find visible tab stops in browser order, including positive tabindex values. */
function getTabStops(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TAB_STOP_SELECTOR))
    .filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(":disabled") &&
        !element.closest("[hidden], [inert], [aria-hidden='true']") &&
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== "hidden"
    )
    .sort((left, right) => {
      const leftOrder = left.tabIndex || Number.MAX_SAFE_INTEGER;
      const rightOrder = right.tabIndex || Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
}

/** Reconnect a portal's Tab boundaries to the trigger's place in the page. */
export function getHoverCardTabExitTarget({
  card,
  trigger,
  shiftKey,
}: {
  readonly card: HTMLElement;
  readonly trigger: HTMLElement;
  readonly shiftKey: boolean;
}): HTMLElement | null {
  const stops = getTabStops(card);
  const activeElement = document.activeElement;
  if (shiftKey) {
    return activeElement === card || activeElement === stops.at(0)
      ? trigger
      : null;
  }
  if (stops.length > 0 && activeElement !== stops.at(-1)) return null;
  const pageStops = getTabStops(document.body).filter(
    (element) => !card.contains(element)
  );
  const triggerIndex = pageStops.indexOf(trigger);
  return triggerIndex >= 0
    ? (pageStops.at(triggerIndex + 1) ?? trigger)
    : trigger;
}
