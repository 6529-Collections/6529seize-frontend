export interface SliderTheme {
  track: {
    background: string;
    hover: string;
  };
  progress: {
    background: string;
    glow: string;
  };
  thumb: {
    background: string;
    glow: string;
    border: string;
    hover: string;
  };
  tooltip: {
    background: string;
    text: string;
  };
}

type RankKey = 1 | 2 | 3 | "default";

export const SLIDER_THEMES: Record<RankKey, SliderTheme> = {
  1: {
    track: {
      background: "tw-bg-gradient-to-r tw-from-[#E8D48A]/10 tw-via-[#42382A]/20 tw-to-[#E8D48A]/10",
      hover: "group-hover:tw-from-[#E8D48A]/15 group-hover:tw-via-[#42382A]/25 group-hover:tw-to-[#E8D48A]/15",
    },
    progress: {
      background: "tw-bg-gradient-to-r tw-from-[#E8D48A]/90 tw-via-[#D9A962] tw-to-[#E8D48A]/90",
      glow: "tw-shadow-[0_0_15px_rgba(217,169,98,0.25)]",
    },
    thumb: {
      background: "tw-bg-gradient-to-b tw-from-[#E8D48A] tw-to-[#D9A962]",
      glow: "tw-shadow-[0_0_15px_rgba(217,169,98,0.4)]",
      border: "tw-border-[#E8D48A]",
      hover: "hover:tw-shadow-[0_0_20px_rgba(217,169,98,0.6)]",
    },
    tooltip: {
      background: "tw-bg-[#E8D48A]",
      text: "tw-text-iron-950",
    },
  },
  2: {
    track: {
      background: "tw-bg-gradient-to-r tw-from-[#DDDDDD]/10 tw-via-[#2D2D32]/20 tw-to-[#DDDDDD]/10",
      hover: "group-hover:tw-from-[#DDDDDD]/15 group-hover:tw-via-[#2D2D32]/25 group-hover:tw-to-[#DDDDDD]/15",
    },
    progress: {
      background: "tw-bg-gradient-to-r tw-from-[#DDDDDD]/90 tw-via-[#C0C0C0] tw-to-[#DDDDDD]/90",
      glow: "tw-shadow-[0_0_15px_rgba(192,192,192,0.25)]",
    },
    thumb: {
      background: "tw-bg-gradient-to-b tw-from-[#DDDDDD] tw-to-[#C0C0C0]",
      glow: "tw-shadow-[0_0_15px_rgba(192,192,192,0.4)]",
      border: "tw-border-[#DDDDDD]",
      hover: "hover:tw-shadow-[0_0_20px_rgba(192,192,192,0.6)]",
    },
    tooltip: {
      background: "tw-bg-[#DDDDDD]",
      text: "tw-text-iron-950",
    },
  },
  3: {
    track: {
      background: "tw-bg-gradient-to-r tw-from-[#CD7F32]/10 tw-via-[#3C2E24]/20 tw-to-[#CD7F32]/10",
      hover: "group-hover:tw-from-[#CD7F32]/15 group-hover:tw-via-[#3C2E24]/25 group-hover:tw-to-[#CD7F32]/15",
    },
    progress: {
      background: "tw-bg-gradient-to-r tw-from-[#CD7F32]/90 tw-via-[#B87333] tw-to-[#CD7F32]/90",
      glow: "tw-shadow-[0_0_15px_rgba(205,127,50,0.25)]",
    },
    thumb: {
      background: "tw-bg-gradient-to-b tw-from-[#CD7F32] tw-to-[#B87333]",
      glow: "tw-shadow-[0_0_15px_rgba(205,127,50,0.4)]",
      border: "tw-border-[#CD7F32]",
      hover: "hover:tw-shadow-[0_0_20px_rgba(205,127,50,0.6)]",
    },
    tooltip: {
      background: "tw-bg-[#CD7F32]",
      text: "tw-text-iron-950",
    },
  },
  default: {
    track: {
      background:
        "tw-bg-gradient-to-r tw-from-iron-600/70 tw-via-iron-500/60 tw-to-iron-600/70",
      hover:
        "group-hover:tw-from-iron-500/80 group-hover:tw-via-iron-400/70 group-hover:tw-to-iron-500/80",
    },
    progress: {
      background:
        "tw-bg-gradient-to-r tw-from-primary-500 tw-via-primary-400 tw-to-primary-500",
      glow: "tw-shadow-[0_0_20px_rgba(64,106,254,0.35)]",
    },
    thumb: {
      background: "tw-bg-gradient-to-b tw-from-primary-200 tw-to-primary-500",
      glow: "tw-shadow-[0_0_20px_rgba(64,106,254,0.35)]",
      border: "tw-border-primary-300",
      hover: "hover:tw-shadow-[0_0_24px_rgba(64,106,254,0.45)]",
    },
    tooltip: {
      background: "tw-bg-iron-650",
      text: "tw-text-white",
    },
  },
} as const;

const isRankTheme = (rank: number | null): rank is Exclude<RankKey, "default"> =>
  rank === 1 || rank === 2 || rank === 3;

export const getSliderTheme = (rank: number | null): SliderTheme => {
  if (isRankTheme(rank)) {
    return SLIDER_THEMES[rank];
  }

  return SLIDER_THEMES.default;
};
