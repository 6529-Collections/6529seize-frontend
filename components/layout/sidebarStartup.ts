import { SIDEBAR_BREAKPOINT, SIDEBAR_WIDTHS } from "@/constants/sidebar";

// Run during head parsing, before React or its bundles are needed. Only the
// document root is marked; React's server-rendered subtree stays untouched.
export const SIDEBAR_STARTUP_SCRIPT = `(() => {
  try {
    if (JSON.parse(globalThis.sessionStorage.getItem("sidebarCollapsed") ?? "null") === false) {
      document.documentElement.setAttribute("data-sidebar-startup", "expanded");
    }
  } catch {
    // Unavailable or invalid storage keeps the normal collapsed default.
  }
})();`;

const pendingExpanded =
  ':root[data-sidebar-startup="expanded"]:not([data-native-runtime]) .layout-root[data-sidebar-ready="false"][data-small="false"]';

// Reserve the correct page geometry before hydration. Only the sidebar's
// contents wait for React to restore their expanded form; the page stays visible.
export const SIDEBAR_STARTUP_STYLES = `
@media (min-width: ${SIDEBAR_BREAKPOINT}px) {
  ${pendingExpanded} {
    --sidebar-width: ${SIDEBAR_WIDTHS.EXPANDED} !important;
  }
  ${pendingExpanded} [data-primary-sidebar] {
    width: ${SIDEBAR_WIDTHS.EXPANDED} !important;
    transition: none !important;
  }
  ${pendingExpanded} [data-sidebar-content] {
    visibility: hidden;
  }
  ${pendingExpanded} > .layout-main {
    padding-left: ${SIDEBAR_WIDTHS.EXPANDED} !important;
    transition: none !important;
  }
}
`;
