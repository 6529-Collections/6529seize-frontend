import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";

// Runs before the app bundle can load touch-first.helpers.ts/useDeviceInfo.
// Mirror their phone override, touch-first inputs, and persisted mouse evidence;
// width alone must never switch a touch laptop to mobile chrome.
export const SMALL_WEB_STARTUP_SCRIPT = `(() => {
  try {
    const root = document.documentElement;
    if (root.hasAttribute("data-native-runtime") || globalThis.innerWidth >= ${SIDEBAR_MOBILE_BREAKPOINT}) return;
    const nav = globalThis.navigator;
    const ua = nav.userAgent;
    const mobileHint = nav.userAgentData?.mobile;
    const phone = mobileHint ?? /iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Android.*Mobile/i.test(ua);
    const mobileDevice = mobileHint ?? /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const matches = query => globalThis.matchMedia?.(query)?.matches ?? false;
    const touch = (nav.maxTouchPoints ?? nav.msMaxTouchPoints ?? 0) > 0 || matches("(any-pointer: coarse)");
    let savedMouse = false;
    try {
      savedMouse = !phone && globalThis.localStorage.getItem("6529-fine-pointer") === "1";
    } catch {
      // Blocked storage does not disable capability detection.
    }
    const fine = savedMouse || matches("(any-pointer: fine)") || matches("(pointer: fine)");
    const hover = matches("(any-hover: hover)") || matches("(hover: hover)");
    if (mobileDevice || (touch && (phone || (!fine && !hover)))) {
      root.setAttribute("data-small-web-startup", "true");
    }
  } catch {
    // Detection failure leaves the ordinary server content available.
  }
})();`;

const pendingSmallWeb =
  ':root[data-small-web-startup="true"]:not([data-native-runtime]) .layout-root[data-small="false"]';

// Correct the existing server shell, without hiding/remounting page content or
// changing React's hydration markup. The hydrated small layout takes over when
// data-small becomes true. Keep this CSS inline so slow bundles cannot flash.
export const SMALL_WEB_STARTUP_STYLES = `
@media (max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 0.02}px) {
  ${pendingSmallWeb} {
    display: block !important;
    max-width: none !important;
    margin-inline: 0 !important;
    overflow: auto;
    background: #000;
    --layout-margin: 0px;
    --left-rail: 0px;
  }
  ${pendingSmallWeb} > [data-web-small-header] { display: block !important; }
  ${pendingSmallWeb} > [data-web-sidebar] { display: none !important; }
  ${pendingSmallWeb} > .layout-main {
    padding-left: 0 !important;
    transform: none !important;
    opacity: 1 !important;
    transition: none !important;
  }
}
`;
