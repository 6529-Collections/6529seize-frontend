export const SIDEBAR_WIDTHS = {
  EXPANDED: "18rem", // 288px = tw-w-72
  COLLAPSED: "4rem", // = 64px = tw-w-16
  SUBMENU: "14rem", // 224px = tw-w-56
} as const;

export const SIDEBAR_DIMENSIONS = {
  COLLAPSED_WIDTH_REM: 4, // 4rem = 64px
  SUBMENU_WIDTH_REM: 14, // 14rem = 224px
  SUBMENU_HEADER_HEIGHT_REM: 3.5, // 3.5rem = 56px
} as const;

export const SIDEBAR_BREAKPOINT = 1280; // xl breakpoint

export const COLLECTIONS_ROUTES = [
  "/the-memes",
  "/meme-lab",
  "/rememes",
  "/6529-gradient",
  "/nextgen",
] as const;
