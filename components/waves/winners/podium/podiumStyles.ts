// Keep the podium hierarchy and restrained rank accents consistent.
export const podiumPositionStyles = {
  first: {
    offset: "tw-order-1 sm:tw-order-2",
    height: "tw-min-h-[220px] sm:tw-min-h-[248px]",
    pfpSize: "tw-size-16 sm:tw-size-20",
    textColor: "tw-text-amber-200",
    ring: "tw-ring-amber-200/55",
    accent: "tw-bg-amber-200/70",
    surface:
      "tw-border-white/[0.12] tw-bg-white/[0.045] sm:tw-shadow-[0_24px_72px_rgba(0,0,0,0.32)]",
    hoverTextColor: "desktop-hover:hover:tw-text-amber-200",
    authorFontSize: "tw-text-sm sm:tw-text-base md:tw-text-xl",
    rankNumber: "01",
  },
  second: {
    offset: "tw-order-2 sm:tw-order-1 sm:tw-pt-8",
    height: "tw-min-h-[196px] sm:tw-min-h-[216px]",
    pfpSize: "tw-size-14 sm:tw-size-16",
    textColor: "tw-text-iron-300",
    ring: "tw-ring-iron-300/45",
    accent: "tw-bg-iron-300/60",
    surface: "tw-bg-white/[0.025]",
    hoverTextColor: "desktop-hover:hover:tw-text-iron-200",
    authorFontSize: "tw-text-sm sm:tw-text-base",
    rankNumber: "02",
  },
  third: {
    offset: "tw-order-3 sm:tw-pt-12",
    height: "tw-min-h-[196px] sm:tw-min-h-[200px]",
    pfpSize: "tw-size-14 sm:tw-size-16",
    textColor: "tw-text-[#C79A75]",
    ring: "tw-ring-[#C79A75]/45",
    accent: "tw-bg-[#C79A75]/60",
    surface: "tw-bg-white/[0.02]",
    hoverTextColor: "desktop-hover:hover:tw-text-[#D5AA87]",
    authorFontSize: "tw-text-sm sm:tw-text-base",
    rankNumber: "03",
  },
} as const;

export const podiumContainerClassName =
  "tw-relative tw-mx-auto tw-max-w-5xl tw-py-2 sm:tw-px-2 sm:tw-pb-4 sm:tw-pt-8";

export const podiumGridClassName =
  "tw-grid tw-grid-cols-1 tw-items-stretch tw-gap-2 sm:tw-grid-cols-3 sm:tw-gap-x-2 lg:tw-gap-x-3";

export const podiumSurfaceClassName =
  "tw-relative tw-flex tw-w-full tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-white/[0.025] tw-px-4 tw-pb-4 tw-pt-4 tw-shadow-[0_16px_48px_rgba(0,0,0,0.18)] tw-transition-[transform,border-color,background-color,box-shadow] tw-duration-200 tw-ease-out";
