interface ResizeSubscription {
  readonly updateHeight: (height: number) => void;
}

const resizeSubscriptions = new Map<Element, ResizeSubscription>();
let sharedResizeObserver: ResizeObserver | null = null;

function getSharedResizeObserver(): ResizeObserver | null {
  if (typeof ResizeObserver === "undefined") {
    return null;
  }

  sharedResizeObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const subscription = resizeSubscriptions.get(entry.target);
      if (!subscription) {
        continue;
      }

      const borderBoxSize = (entry as Partial<ResizeObserverEntry>)
        .borderBoxSize?.[0];
      subscription.updateHeight(
        borderBoxSize?.blockSize ?? entry.contentRect.height
      );
    }
  });

  return sharedResizeObserver;
}

export function observeHeight(
  element: HTMLElement,
  subscription: ResizeSubscription
): (() => void) | undefined {
  const observer = getSharedResizeObserver();
  if (!observer) {
    return undefined;
  }

  resizeSubscriptions.set(element, subscription);
  observer.observe(element);

  return () => {
    observer.unobserve(element);
    resizeSubscriptions.delete(element);

    if (resizeSubscriptions.size === 0) {
      observer.disconnect();
      if (observer === sharedResizeObserver) {
        sharedResizeObserver = null;
      }
    }
  };
}
