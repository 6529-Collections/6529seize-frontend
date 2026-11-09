interface AndroidBackLayer {
  readonly element: () => HTMLElement | null;
  readonly onBack: () => void;
}

const layers = new Set<AndroidBackLayer>();
const OVERLAY_SELECTOR =
  '[role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"], dialog[open]';

/** Register only open surfaces; there are no subscribers or render updates. */
export function registerAndroidBackLayer(layer: AndroidBackLayer): () => void {
  layers.add(layer);
  return () => {
    layers.delete(layer);
  };
}

function isVisible(element: HTMLElement): boolean {
  if (
    !element.isConnected ||
    element.closest('[hidden], [inert], [aria-hidden="true"]')
  ) {
    return false;
  }
  const style = globalThis.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function stackingOrder(element: HTMLElement): number[] {
  const order: number[] = [];
  for (
    let parent: HTMLElement | null = element;
    parent;
    parent = parent.parentElement
  ) {
    const style = globalThis.getComputedStyle(parent);
    const zIndex = Number.parseInt(style.zIndex, 10);
    if (Number.isFinite(zIndex)) {
      order.unshift(zIndex);
    } else if (style.transform && style.transform !== "none") {
      order.unshift(0);
    }
  }
  return order;
}

function compareLayers(left: HTMLElement, right: HTMLElement): number {
  if (left === right) return 0;
  const modalDifference =
    Number(isModalLayer(left)) - Number(isModalLayer(right));
  if (modalDifference !== 0) return modalDifference;
  if (left.contains(right)) return -1;
  if (right.contains(left)) return 1;
  const leftOrder = stackingOrder(left);
  const rightOrder = stackingOrder(right);
  const length = Math.max(leftOrder.length, rightOrder.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftOrder[index] ?? 0) - (rightOrder[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
}

function isModalLayer(element: HTMLElement): boolean {
  try {
    // showModal() promotes a dialog above every ordinary CSS stacking context.
    return element.closest("dialog")?.matches(":modal") ?? false;
  } catch {
    return false;
  }
}

/**
 * Handle one visible layer, including a blocked/non-dismissable one. An unknown
 * dialog must never let Back navigate the page underneath it.
 */
export function dismissAndroidBackLayer(): boolean {
  const registrations = Array.from(layers, (layer) => ({
    layer,
    element: layer.element(),
  }));
  const elements = new Set(
    document.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR)
  );
  for (const { element } of registrations) {
    if (element) elements.add(element);
  }
  let top: HTMLElement | null = null;
  for (const element of elements) {
    if (isVisible(element) && (!top || compareLayers(top, element) < 0)) {
      top = element;
    }
  }
  if (!top) return false;

  const registered = registrations.find(({ element }) => element === top);
  if (registered) {
    registered.layer.onBack();
    return true;
  }

  // MenuItems owns Escape locally and stops propagation before it reaches the
  // sheet or window. Do not broadcast Escape to global modal listeners.
  if (
    /^headlessui-(menu-items|listbox-options)-/.test(top.id) &&
    ["menu", "listbox"].includes(top.getAttribute("role") ?? "")
  ) {
    top.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
        cancelable: true,
      })
    );
  }
  return true;
}
