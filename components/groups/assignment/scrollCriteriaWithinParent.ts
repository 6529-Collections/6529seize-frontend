// Inline editors share their form's scrollport. scrollIntoView also moves
// outer app-shell scrollports, displacing the native Create Wave screen.
// Stop at the nearest scrollport even when its content has just shrunk to fit.
export function scrollCriteriaWithinParent(
  target: HTMLElement | null,
  block: "start" | "nearest"
) {
  if (!target) return;
  for (
    let parent = target.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    if (!["auto", "scroll"].includes(getComputedStyle(parent).overflowY))
      continue;
    const bounds = parent.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    const margin =
      Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const top = targetBounds.top - bounds.top - parent.clientTop - margin;
    const bottom =
      targetBounds.bottom - bounds.top - parent.clientTop - parent.clientHeight;
    if (block === "start" || top < 0) parent.scrollTop += top;
    else if (bottom > 0) parent.scrollTop += bottom;
    return;
  }
}
