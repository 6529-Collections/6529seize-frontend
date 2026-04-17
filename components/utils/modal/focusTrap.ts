const FOCUSABLE_SELECTOR =
  "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1']),[contenteditable='true']";

const isFocusableElement = (element: HTMLElement): boolean => {
  if (!element.isConnected) {
    return false;
  }

  if (element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  if (element instanceof HTMLInputElement && element.type === "hidden") {
    return false;
  }

  return !element.hasAttribute("disabled");
};

const focusElement = (event: KeyboardEvent, element: HTMLElement): void => {
  event.preventDefault();
  element.focus();
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(isFocusableElement);

export const trapTabFocus = (
  event: KeyboardEvent,
  container: HTMLElement
): void => {
  if (event.key !== "Tab") {
    return;
  }

  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0] ?? null;
  const lastElement = focusableElements[focusableElements.length - 1] ?? null;
  if (!firstElement || !lastElement) {
    focusElement(event, container);
    return;
  }

  const activeElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const activeInsideContainer =
    !!activeElement && container.contains(activeElement);

  const shouldFocusLastElement =
    event.shiftKey &&
    (!activeInsideContainer ||
      activeElement === firstElement ||
      activeElement === container);
  if (shouldFocusLastElement) {
    focusElement(event, lastElement);
    return;
  }

  if (event.shiftKey) {
    return;
  }

  const shouldFocusFirstElement =
    !activeInsideContainer ||
    activeElement === lastElement ||
    activeElement === container;
  if (shouldFocusFirstElement) {
    focusElement(event, firstElement);
  }
};
