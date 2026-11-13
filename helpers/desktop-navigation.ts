/**
 * Navigation decisions for 6529 Desktop, kept free of React and of the bridge
 * so they can be tested on their own.
 */

interface DesktopNavigationTarget {
  /** Same-origin path, query and hash; safe to hand to the router. */
  readonly url: string;
  /** True when the target is the current page, so history is not grown. */
  readonly replace: boolean;
}

/**
 * Turn a deep-link path from the shell (for example
 * `/accept-connection-sharing?connection_share_code=…#device_setup_key=…`)
 * into a router target. Only same-origin paths are accepted: no other
 * scheme, no protocol-relative `//host`, no backslashes. When the target is
 * the page already open, `reload=true` is added so the page reads the new
 * query (an incoming connection share must not be lost).
 */
export function getDesktopNavigationTarget(
  value: string,
  origin: string,
  currentPathname: string
): DesktopNavigationTarget | null {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }
  let target: URL;
  try {
    target = new URL(value, origin);
  } catch {
    return null;
  }
  if (target.origin !== origin) return null;
  const replace = target.pathname === currentPathname;
  if (replace) target.searchParams.set("reload", "true");
  return { url: `${target.pathname}${target.search}${target.hash}`, replace };
}

type DesktopLinkAction =
  | { readonly kind: "navigate"; readonly url: string }
  | { readonly kind: "external"; readonly url: string };

interface LinkClick {
  readonly button: number;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly defaultPrevented: boolean;
}

interface LinkElement {
  readonly target: string;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
}

/**
 * The desktop window opens no second windows. For a link click that would
 * open one (`target="_blank"`, a modifier key or the middle button), return
 * what to do instead: navigate in place for this app's own pages, or open an
 * http(s) page in the system browser. Anything else is left alone.
 */
export function getDesktopLinkAction(
  link: LinkElement,
  click: LinkClick,
  origin: string
): DesktopLinkAction | null {
  if (click.defaultPrevented || link.hasAttribute("download")) return null;
  // Only the primary and middle buttons follow links.
  if (click.button !== 0 && click.button !== 1) return null;
  const opensNewWindow =
    link.target === "_blank" ||
    click.ctrlKey ||
    click.metaKey ||
    click.shiftKey ||
    click.button === 1;
  if (!opensNewWindow) return null;

  const href = link.getAttribute("href")?.trim();
  if (!href || href.startsWith("#")) return null;
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin === origin) {
    return { kind: "navigate", url: `${url.pathname}${url.search}${url.hash}` };
  }
  if (url.protocol === "https:" || url.protocol === "http:") {
    return { kind: "external", url: url.href };
  }
  return null;
}
