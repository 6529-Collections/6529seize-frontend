// Keep the podium stagger and rank colors consistent across all states.
export const podiumPositionStyles = {
  first: {
    offset: "",
    height: "tw-min-h-[220px]",
    pfpSize: "tw-size-14",
    textColor: "tw-text-amber-400",
    ring: "tw-ring-amber-400",
    surface: "tw-from-amber-400/[0.08]",
    hoverTextColor: "desktop-hover:hover:tw-text-amber-400",
    authorFontSize: "tw-text-sm sm:tw-text-base md:tw-text-xl",
    positionText: "1st",
  },
  second: {
    offset: "tw-pt-8",
    height: "tw-min-h-[200px]",
    pfpSize: "tw-size-11",
    textColor: "tw-text-slate-400",
    ring: "tw-ring-slate-400",
    surface: "tw-from-slate-400/[0.06]",
    hoverTextColor: "desktop-hover:hover:tw-text-slate-400",
    authorFontSize: "tw-text-sm sm:tw-text-base",
    positionText: "2nd",
  },
  third: {
    offset: "tw-pt-12",
    height: "tw-min-h-[184px]",
    pfpSize: "tw-size-11",
    textColor: "tw-text-[#CD7F32]",
    ring: "tw-ring-[#CD7F32]",
    surface: "tw-from-[#CD7F32]/[0.06]",
    hoverTextColor: "desktop-hover:hover:tw-text-[#CD7F32]",
    authorFontSize: "tw-text-sm sm:tw-text-base",
    positionText: "3rd",
  },
} as const;

export const podiumContainerClassName =
  "tw-relative tw-mx-auto tw-rounded-xl tw-bg-iron-950/60 tw-px-1 tw-pb-2 tw-pt-6 sm:tw-px-3 lg:tw-px-4";

export const podiumGridClassName =
  "tw-mx-auto tw-grid tw-max-w-3xl tw-grid-cols-3 tw-items-stretch tw-gap-x-2 lg:tw-gap-x-4";

export const podiumSurfaceClassName =
  "tw-relative tw-flex tw-w-full tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50 tw-px-2 tw-pb-4 tw-pt-8 sm:tw-px-3";
