import { sameMainPath } from "@/helpers/navigation.helpers";

const SCROLL_TARGET = '[data-mobile-bottom-nav-scroll-target="true"]';
const MAX_POSITIONS = 50;

interface ScrollPosition {
  windowTop: number;
  containers: Map<number, number>;
}

const normalizeHref = (href: string) => {
  const url = new URL(href, window.location.href);
  const query = url.searchParams.toString();
  return url.pathname + (query ? `?${query}` : "") + url.hash;
};
const currentHref = () => normalizeHref(window.location.href);

// Stream lists own their virtualized offsets and must not have two restorers.
const ownsScrollPosition = (href: string) =>
  /^\/(waves|messages|notifications)(?:[/?#]|$)/.test(href);

function getForwardDestination(event: MouseEvent): string | null {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return null;
  const anchor =
    event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (
    !(anchor instanceof HTMLAnchorElement) ||
    anchor.hasAttribute("download") ||
    (anchor.target && anchor.target !== "_self")
  )
    return null;
  const destination = new URL(anchor.href, window.location.href);
  if (
    destination.origin !== window.location.origin ||
    destination.hash ||
    sameMainPath(window.location.pathname, destination.pathname)
  )
    return null;
  const href = destination.pathname + destination.search;
  return ownsScrollPosition(href) ? null : href;
}

function restoreScrollPosition(position: ScrollPosition) {
  let ready =
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight) >=
    position.windowTop;
  if (ready && window.scrollY !== position.windowTop)
    window.scrollTo({ top: position.windowTop, behavior: "instant" });
  const containers = document.querySelectorAll<HTMLElement>(SCROLL_TARGET);
  for (const [index, top] of position.containers) {
    const container = containers[index];
    if (!container || container.scrollHeight - container.clientHeight < top)
      ready = false;
    else if (container.scrollTop !== top)
      container.scrollTo({ top, behavior: "instant" });
  }
  return ready;
}

function createForwardNavigationHandler(
  isNative: () => boolean,
  save: (href: string, position: ScrollPosition) => void,
  prepare: (href: string, position: ScrollPosition, from: string) => boolean
) {
  return (event: MouseEvent) => {
    const href = getForwardDestination(event);
    if (!href) return;
    const containers = Array.from(
      document.querySelectorAll<HTMLElement>(SCROLL_TARGET)
    );
    // Save the source before Next's scroll heuristic touches either page.
    save(currentHref(), {
      windowTop: window.scrollY,
      containers: new Map(
        containers.map((element, index) => [index, element.scrollTop])
      ),
    });
    if (!isNative()) return;
    prepare(
      href,
      {
        windowTop: 0,
        containers: new Map(containers.map((_element, index) => [index, 0])),
      },
      window.location.pathname
    );
  };
}

/** Numeric offsets only, bounded to recent visits; no retained page trees. */
export function createNavigationScrollRestoration({
  isNative = () => false,
}: { readonly isNative?: () => boolean } = {}) {
  const positions = new Map<string, ScrollPosition>();
  let pending: {
    href: string;
    position: ScrollPosition;
    from?: string | undefined;
  } | null = null;
  let stopRestoring = () => {};

  const save = (rawHref: string, position: ScrollPosition) => {
    const href = normalizeHref(rawHref);
    positions.delete(href);
    positions.set(href, position);
    if (positions.size > MAX_POSITIONS)
      positions.delete(positions.keys().next().value!);
  };

  const remember = (event: Event) => {
    const href = currentHref();
    if (pending?.href === href || ownsScrollPosition(href)) return;
    const target = event.target;
    const isWindow = target === document || target === window;
    if (
      !isWindow &&
      !(target instanceof HTMLElement && target.matches(SCROLL_TARGET))
    )
      return;
    const position = positions.get(href) ?? {
      windowTop: window.scrollY,
      containers: new Map<number, number>(),
    };
    if (isWindow) {
      position.windowTop = window.scrollY;
    } else if (target instanceof HTMLElement) {
      const index = Array.from(
        document.querySelectorAll(SCROLL_TARGET)
      ).indexOf(target);
      position.containers.set(index, target.scrollTop);
    }
    save(href, position);
  };

  const prepare = (
    rawHref: string,
    savedPosition?: ScrollPosition,
    from?: string
  ) => {
    const href = normalizeHref(rawHref);
    const position = savedPosition ?? positions.get(href);
    stopRestoring();
    stopRestoring = () => {};
    pending = null;
    // Explicit anchors (such as collected artwork) have their own restoration.
    if (href.includes("#") || ownsScrollPosition(href)) return false;
    if (!position) return false;
    pending = {
      href,
      from,
      position: { ...position, containers: new Map(position.containers) },
    };
    const expiry =
      from === undefined
        ? undefined
        : window.setTimeout(() => {
            pending = null;
          }, 10000);
    stopRestoring = () => {
      clearTimeout(expiry);
      pending = null;
    };
    return true;
  };

  const prepareForward = createForwardNavigationHandler(
    isNative,
    save,
    prepare
  );

  const committed = (rawHref: string) => {
    const href = normalizeHref(rawHref);
    if (!pending) return;
    const returning = pending;
    stopRestoring();
    pending = returning;
    const from = pending.from;
    const matches =
      from === undefined
        ? href === pending.href
        : !sameMainPath(from, href) &&
          !ownsScrollPosition(href) &&
          !href.includes("#");
    if (!matches) {
      stopRestoring();
      pending = null;
      stopRestoring = () => {};
      return;
    }
    const { position } = pending;
    let frame = 0;
    let timeout = 0;
    const stop = () => {
      pending = null;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      for (const type of ["wheel", "touchstart", "keydown"]) {
        document.removeEventListener(type, stop, true);
      }
    };
    const restore = () => {
      frame = 0;
      if (currentHref() !== href) {
        stop();
        return;
      }
      if (restoreScrollPosition(position)) stop();
      else frame = requestAnimationFrame(restore);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(restore);
    };
    for (const type of ["wheel", "touchstart", "keydown"]) {
      document.addEventListener(type, stop, { capture: true, passive: true });
    }
    stopRestoring = stop;
    timeout = window.setTimeout(stop, 1500);
    schedule();
  };

  const listen = () => {
    const cancelForward = () => {
      if (pending?.from !== undefined) stopRestoring();
    };
    window.addEventListener("popstate", cancelForward);
    document.addEventListener("click", prepareForward, true);
    document.addEventListener("scroll", remember, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("popstate", cancelForward);
      document.removeEventListener("click", prepareForward, true);
      document.removeEventListener("scroll", remember, true);
      stopRestoring();
      pending = null;
    };
  };
  return { prepare, committed, listen };
}
