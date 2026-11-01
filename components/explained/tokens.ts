/**
 * The 6529 Explained tokens (EXPLAINED.md §5). Every colour is a 6529.io
 * token from `tailwind.config.ts`; there is no new colour token. Status uses
 * green (holds) and rose (fails) only, always with a shape and a word; blue
 * means now, you, act. The reference implementation is the mockups'
 * `explained.css`; these are the same values as Tailwind classes, plus the
 * hex values SVG figures need.
 *
 * Breakpoints are 6529.io's: a phone is below `md` (768 px), the editorial
 * grids open from `lg` (1024 px), where the content column is wide enough
 * for the label, text and margin columns.
 */

/** Colour roles as hex, for SVG. Each names its Tailwind token. */
export const EX_HEX = {
  /** black: the app shell */
  shell: "#000000",
  /** ABOUT_CONTENT_SURFACE: the page */
  surface: "#0D0D0F",
  /** iron-950: lenses, panels */
  panel: "#131316",
  /** iron-900: hairlines on panels */
  raised: "#1C1C21",
  /** iron-800: borders */
  line: "#26272B",
  /** iron-700: stronger borders, axes */
  line2: "#37373E",
  /** iron-50: headings, numbers (17.8:1 on the surface) */
  ink1: "#F5F5F5",
  /** iron-300: body (12.5:1) */
  ink2: "#CECFD4",
  /** iron-400: secondary text (6.4:1) */
  ink3: "#93939F",
  /** iron-600: rules and ticks only (3.1:1), never text */
  ink4: "#60606C",
  /** primary-400: now, you, act */
  you: "#528BFF",
  /** primary-300: blue text (8.7:1) */
  youInk: "#84ADFF",
  /** green: proved, tested, equal, agreement (9.3:1) */
  holds: "#3CCB7F",
  /** error: shown false, differs, simulated, a broken model (7.0:1) */
  fails: "#F97066",
  /** iron-200: the one main action */
  cta: "#ECECEE",
} as const;

/** Translucent fills drawn from the same tokens, for SVG. */
export const EX_FILL = {
  youArea: "rgba(82, 139, 255, 0.30)",
  youTint: "rgba(82, 139, 255, 0.12)",
  youHull: "rgba(82, 139, 255, 0.07)",
  neutralArea: "rgba(206, 207, 212, 0.10)",
  neutralTile: "rgba(206, 207, 212, 0.12)",
  holdsTint: "rgba(60, 203, 127, 0.09)",
  failsTint: "rgba(249, 112, 102, 0.09)",
} as const;

/** Colour roles as Tailwind classes. */
export const EX_COLOR = {
  surface: "tw-bg-[#0D0D0F]",
  panel: "tw-bg-iron-950",
  /** a panel's sunken footer or rail: the panel with black over it */
  sunken: "tw-bg-black/20",
  raisedBorder: "tw-border-iron-900",
  lineBorder: "tw-border-iron-800",
  line2Border: "tw-border-iron-700",
  ink1: "tw-text-iron-50",
  ink2: "tw-text-iron-300",
  ink3: "tw-text-iron-400",
  youText: "tw-text-primary-300",
  youBg: "tw-bg-primary-400",
  youBorder: "tw-border-primary-400",
  youTint: "tw-bg-primary-400/[0.12]",
  holdsText: "tw-text-green",
  holdsBorder: "tw-border-green/40",
  holdsTint: "tw-bg-green/[0.09]",
  failsText: "tw-text-error",
  failsBorder: "tw-border-error/50",
  failsTint: "tw-bg-error/[0.09]",
  cta: "tw-bg-iron-200 tw-text-iron-950",
} as const;

/**
 * The type scale (EXPLAINED.md §5.2): phone first, desktop from `md`.
 * Montserrat throughout (the site's font); mono for hashes, code and rules.
 */
export const EX_TEXT = {
  /** hub and chapter overviews: 84/88, phone 44/48 */
  display:
    "tw-m-0 tw-text-[44px] tw-font-semibold tw-leading-[48px] tw-tracking-[-0.03em] tw-text-iron-50 md:tw-text-[84px] md:tw-leading-[88px] md:tw-tracking-[-0.035em]",
  /** the hub's title: 80/84, phone 42/46 */
  displayHub:
    "tw-m-0 tw-text-[42px] tw-font-semibold tw-leading-[46px] tw-tracking-[-0.03em] tw-text-iron-50 md:tw-text-[80px] md:tw-leading-[84px] md:tw-tracking-[-0.035em]",
  /** sample openers: 72/76, phone 40/44 */
  opener:
    "tw-m-0 tw-text-[40px] tw-font-semibold tw-leading-[44px] tw-tracking-[-0.03em] tw-text-iron-50 md:tw-text-[72px] md:tw-leading-[76px]",
  /** explainers and guides: 64/68, phone 38/43 */
  h1: "tw-m-0 tw-text-balance tw-text-[38px] tw-font-semibold tw-leading-[43px] tw-tracking-[-0.032em] tw-text-iron-50 md:tw-text-[64px] md:tw-leading-[68px]",
  /** evidence and reference: 46/52, phone 32/38 */
  h1r: "tw-m-0 tw-text-balance tw-text-[32px] tw-font-semibold tw-leading-[38px] tw-tracking-[-0.026em] tw-text-iron-50 md:tw-text-[46px] md:tw-leading-[52px]",
  /** statement heading: 44/50, phone 29/35 */
  stmt: "tw-m-0 tw-text-balance tw-text-[29px] tw-font-semibold tw-leading-[35px] tw-tracking-[-0.026em] tw-text-iron-50 md:tw-text-[44px] md:tw-leading-[50px]",
  h2: "tw-m-0 tw-text-balance tw-text-[25px] tw-font-semibold tw-leading-[32px] tw-tracking-[-0.02em] tw-text-iron-50 md:tw-text-[32px] md:tw-leading-[40px]",
  h3: "tw-m-0 tw-text-[21px] tw-font-semibold tw-leading-[28px] tw-tracking-[-0.01em] tw-text-iron-50",
  h4: "tw-m-0 tw-text-[17px] tw-font-semibold tw-leading-6 tw-text-iron-50",
  /** a model's question: 24/32, phone 20/27 */
  lensQ:
    "tw-m-0 tw-max-w-[760px] tw-text-balance tw-text-[20px] tw-font-semibold tw-leading-[27px] tw-tracking-[-0.012em] tw-text-iron-50 md:tw-text-[24px] md:tw-leading-8",
  /** one sentence, at most 45 words: 22/34, phone 18/28 */
  lede: "tw-m-0 tw-max-w-[700px] tw-text-[18px] tw-font-normal tw-leading-[28px] tw-text-iron-300 md:tw-text-[22px] md:tw-leading-[34px]",
  /** body: 18/29, phone 16/26 */
  body: "tw-text-base tw-leading-[26px] tw-text-iron-300 md:tw-text-[18px] md:tw-leading-[29px]",
  /** cards, answers, tables: 15/24 */
  small: "tw-text-[15px] tw-leading-6",
  /** captions: 15/23, ink-3 */
  cap: "tw-text-[15px] tw-leading-[23px] tw-text-iron-400",
  /** source lines only: 13/20 */
  meta: "tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400",
  /** label and eyebrow: 12/16 capitals */
  label:
    "tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400",
  numXl:
    "tw-text-[40px] tw-font-semibold tw-leading-[44px] tw-tracking-[-0.02em] tw-text-iron-50 tw-tabular-nums md:tw-text-[60px] md:tw-leading-[64px]",
  numL: "tw-text-[30px] tw-font-semibold tw-leading-9 tw-tracking-[-0.02em] tw-text-iron-50 tw-tabular-nums md:tw-text-[40px] md:tw-leading-[46px]",
  numM: "tw-text-[26px] tw-font-semibold tw-leading-8 tw-tracking-[-0.02em] tw-text-iron-50 tw-tabular-nums",
  mono: "tw-font-mono tw-text-[13px] tw-leading-5 tw-tracking-normal md:tw-text-sm md:tw-leading-[21px]",
  /** the candour line: 24/34, phone 20/29 */
  candour:
    "tw-m-0 tw-max-w-[760px] tw-text-[20px] tw-font-semibold tw-leading-[29px] tw-tracking-[-0.012em] tw-text-iron-50 md:tw-text-2xl md:tw-leading-[34px]",
} as const;

/** The mono stack (EXPLAINED.md §5.2), for SVG and inline styles. */
export const EX_MONO_STACK =
  'ui-monospace, "Cascadia Mono", "SF Mono", Consolas, monospace';

/** Spacing (EXPLAINED.md §5.3): a 4 px base and its steps. */
export const EX_SPACE = [4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 120] as const;

export const EX_LAYOUT = {
  /** the page's gutters: 20 px on a phone, 48 px on a desktop */
  page: "tw-mx-auto tw-w-full tw-max-w-[1244px] tw-px-5 md:tw-px-12",
  /** a section: 120 px above on a desktop, 76 on a phone */
  section: "tw-pt-[76px] md:tw-pt-[120px]",
  /** a tight section: 80 px, 52 on a phone */
  sectionTight: "tw-pt-[52px] md:tw-pt-20",
  /** the paragraph gap: 18 px, 0.62 of a desktop line */
  paragraph: "tw-m-0 tw-mb-[18px] tw-max-w-[660px] last:tw-mb-0",
  /** the editorial grid: label 192, text 660, margin 236, gutters 32 */
  ed: "tw-grid tw-grid-cols-1 tw-gap-y-4 lg:tw-grid-cols-[192px_minmax(0,660px)_minmax(0,236px)] lg:tw-gap-x-8 lg:tw-gap-y-0",
  edWide: "lg:tw-col-span-2",
  edFull: "lg:tw-col-span-3",
  /** the statement row: heading left, prose right, 5 : 6, 64 px apart */
  stmt: "tw-grid tw-grid-cols-1 tw-items-start tw-gap-y-4 lg:tw-grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:tw-gap-x-16",
} as const;

/** Radius (EXPLAINED.md §5.3): models 16, panels 12, controls 8, tags 4. */
export const EX_RADIUS = {
  lens: "tw-rounded-2xl",
  panel: "tw-rounded-xl",
  control: "tw-rounded-lg",
  tag: "tw-rounded",
  pill: "tw-rounded-full",
} as const;

/** Elevation: two shadows, for floating menus and for art. */
export const EX_ELEVATION = {
  menu: "tw-shadow-[0_20px_40px_rgba(0,0,0,0.5)]",
  art: "tw-shadow-[0_18px_40px_rgba(0,0,0,0.45)]",
} as const;

/**
 * Motion (EXPLAINED.md §5.4): 6529.io's easing; a model's change 160 ms, a
 * live number 400 ms; nothing moves under reduced motion; no ambient motion.
 */
export const EX_MOTION = {
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  modelMs: 160,
  liveMs: 400,
  model:
    "tw-transition-all tw-duration-150 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none",
  live: "tw-transition-all tw-duration-[400ms] tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none",
} as const;

/** The focus ring: 2 px blue, everywhere. */
export const EX_FOCUS =
  "focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

/** Buttons: one main action per screen (cta), the rest secondary. */
/**
 * A button keeps to one line, except at 400% zoom (a 320 px window beside
 * the site's rail): below 360 px a long label wraps inside it and the
 * button grows to fit, instead of running past the page.
 */
const WRAP_WHEN_NARROW =
  "max-[359px]:tw-h-auto max-[359px]:tw-min-h-[46px] max-[359px]:tw-whitespace-normal max-[359px]:tw-py-2.5";

export const EX_BUTTON = {
  cta: `tw-inline-flex tw-h-[46px] tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border-0 tw-bg-iron-200 tw-px-[22px] tw-text-[15px] tw-font-semibold tw-text-iron-950 tw-no-underline hover:tw-bg-iron-50 md:tw-text-base ${WRAP_WHEN_NARROW} ${EX_FOCUS}`,
  secondary: `tw-inline-flex tw-h-[46px] tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-white/[0.06] tw-px-5 tw-text-[15px] tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-border-iron-600 md:tw-text-base ${WRAP_WHEN_NARROW} ${EX_FOCUS}`,
  link: `tw-inline-flex tw-items-center tw-gap-1.5 tw-text-base tw-font-semibold tw-text-primary-300 tw-no-underline hover:tw-underline hover:tw-underline-offset-[3px] ${EX_FOCUS}`,
} as const;

/** A text link inside prose. */
export const EX_LINK = `tw-text-primary-300 tw-no-underline hover:tw-underline hover:tw-underline-offset-[3px] ${EX_FOCUS}`;

/** Visually hidden, read by screen readers. */
export const EX_SR_ONLY = "tw-sr-only";
