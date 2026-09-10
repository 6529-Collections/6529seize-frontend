// Keep the podium hierarchy and restrained rank accents consistent.
export const podiumPositionStyles = {
  first: {
    offset: "",
    height: "tw-min-h-[180px] sm:tw-min-h-[220px]",
    pfpSize: "tw-size-14 sm:tw-size-20",
    pfpOverlap: "-tw-mb-7 sm:-tw-mb-10",
    textColor: "tw-text-amber-200",
    ring: "tw-ring-amber-200/55",
    gradient: "tw-from-amber-300/[0.13] tw-via-amber-200/[0.035]",
    surface:
      "tw-border-white/[0.12] tw-from-white/[0.055] tw-via-white/[0.018]",
    hoverTextColor: "desktop-hover:hover:tw-text-amber-200",
    authorFontSize:
      "tw-text-[9px] min-[360px]:tw-text-[11px] sm:tw-text-base md:tw-text-xl",
  },
  second: {
    offset: "tw-pt-6 sm:tw-pt-8",
    height: "tw-min-h-[160px] sm:tw-min-h-[200px]",
    pfpSize: "tw-size-11 sm:tw-size-16",
    pfpOverlap: "-tw-mb-[22px] sm:-tw-mb-8",
    textColor: "tw-text-iron-300",
    ring: "tw-ring-iron-300/45",
    gradient: "tw-from-iron-300/[0.09] tw-via-iron-200/[0.025]",
    surface: "tw-from-white/[0.035] tw-via-white/[0.012]",
    hoverTextColor: "desktop-hover:hover:tw-text-iron-200",
    authorFontSize: "tw-text-[9px] min-[360px]:tw-text-[11px] sm:tw-text-base",
  },
  third: {
    offset: "tw-pt-9 sm:tw-pt-12",
    height: "tw-min-h-[144px] sm:tw-min-h-[184px]",
    pfpSize: "tw-size-11 sm:tw-size-16",
    pfpOverlap: "-tw-mb-[22px] sm:-tw-mb-8",
    textColor: "tw-text-[#C79A75]",
    ring: "tw-ring-[#C79A75]/45",
    gradient: "tw-from-[#C79A75]/[0.11] tw-via-[#C79A75]/[0.025]",
    surface: "tw-from-white/[0.03] tw-via-white/[0.01]",
    hoverTextColor: "desktop-hover:hover:tw-text-[#D5AA87]",
    authorFontSize: "tw-text-[9px] min-[360px]:tw-text-[11px] sm:tw-text-base",
  },
} as const;

export const podiumContainerClassName =
  "tw-relative tw-mx-auto tw-max-w-5xl tw-px-1 tw-pb-2 tw-pt-6 tw-@container/podium sm:tw-px-2 sm:tw-pb-4 sm:tw-pt-8";

export const podiumGridClassName =
  "tw-grid tw-grid-cols-3 tw-items-stretch tw-gap-x-1 sm:tw-gap-x-2 lg:tw-gap-x-3";

export const podiumSurfaceClassName =
  "tw-relative tw-flex tw-w-full tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-overflow-hidden tw-rounded-t-xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-bg-gradient-to-b tw-to-transparent tw-px-1 tw-pb-3 tw-pt-3 tw-transition-[transform,border-color] tw-duration-200 tw-ease-out min-[360px]:tw-px-2 sm:tw-px-4 sm:tw-pb-4 sm:tw-pt-4";
