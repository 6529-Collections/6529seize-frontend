export const SIDEBAR_WIDTHS = {
  EXPANDED: '18rem',      // tw-w-72
  COLLAPSED: '4rem',      // tw-w-16 
  SUBMENU: '16rem',       // Collections submenu width
} as const;

export const SIDEBAR_BREAKPOINT = 768; // md breakpoint

export const COLLECTIONS_ROUTES = [
  '/the-memes',
  '/meme-lab', 
  '/gradients',
  '/6529-gradient',
  '/nextgen',
] as const;