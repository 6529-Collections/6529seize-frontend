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
    border: string;
    glow: string;
    hover: string;
  };
  tooltip: {
    background: string;
    text: string;
  };
}

type RankKey = 1 | 2 | 3 | 'default';

export const SLIDER_THEMES: Record<RankKey, SliderTheme> = {
  1: {
    track: {
      background: "tw-bg-gradient-to-r tw-from-[#E8D48A]/10 tw-via-[#42382A]/20 tw-to-[#E8D48A]/10",
      hover: "group-hover:tw-from-[#E8D48A]/15 group-hover:tw-via-[#42382A]/25 group-hover:tw-to-[#E8D48A]/15"
    },
    progress: {
      background: "tw-bg-gradient-to-r tw-from-[#E8D48A]/90 tw-via-[#D9A962] tw-to-[#E8D48A]/90",
      glow: "tw-shadow-[0_0_15px_rgba(217,169,98,0.25)]"
    },
    thumb: {
      border: "tw-border-[#D9A962]",
      glow: "after:tw-shadow-[0_0_12px_rgba(217,169,98,0.4)]",
      hover: "group-hover:tw-border-[#E8D48A]"
    },
    tooltip: {
      background: "tw-bg-gradient-to-b tw-from-[#42382A] tw-to-[#2A2416]",
      text: "tw-text-[#E8D48A]"
    }
  },
  2: {
    track: {
      background: "tw-bg-gradient-to-r tw-from-[#DDDDDD]/10 tw-via-[#2D2D32]/20 tw-to-[#DDDDDD]/10",
      hover: "group-hover:tw-from-[#DDDDDD]/15 group-hover:tw-via-[#2D2D32]/25 group-hover:tw-to-[#DDDDDD]/15"
    },
    progress: {
      background: "tw-bg-gradient-to-r tw-from-[#DDDDDD]/90 tw-via-[#C0C0C0] tw-to-[#DDDDDD]/90",
      glow: "tw-shadow-[0_0_15px_rgba(192,192,192,0.25)]"
    },
    thumb: {
      border: "tw-border-[#C0C0C0]",
      glow: "after:tw-shadow-[0_0_12px_rgba(192,192,192,0.4)]",
      hover: "group-hover:tw-border-[#DDDDDD]"
    },
    tooltip: {
      background: "tw-bg-gradient-to-b tw-from-[#2D2D32] tw-to-[#1F1F25]",
      text: "tw-text-[#DDDDDD]"
    }
  },
  3: {
    track: {
      background: "tw-bg-gradient-to-r tw-from-[#CD7F32]/10 tw-via-[#3C2E24]/20 tw-to-[#CD7F32]/10",
      hover: "group-hover:tw-from-[#CD7F32]/15 group-hover:tw-via-[#3C2E24]/25 group-hover:tw-to-[#CD7F32]/15"
    },
    progress: {
      background: "tw-bg-gradient-to-r tw-from-[#CD7F32]/90 tw-via-[#B87333] tw-to-[#CD7F32]/90",
      glow: "tw-shadow-[0_0_15px_rgba(205,127,50,0.25)]"
    },
    thumb: {
      border: "tw-border-[#B87333]",
      glow: "after:tw-shadow-[0_0_12px_rgba(205,127,50,0.4)]",
      hover: "group-hover:tw-border-[#CD7F32]"
    },
    tooltip: {
      background: "tw-bg-gradient-to-b tw-from-[#3C2E24] tw-to-[#2A1F18]",
      text: "tw-text-[#CD7F32]"
    }
  },
  default: {
    track: {
      background: "tw-bg-gradient-to-r tw-from-iron-800/50 tw-via-iron-700/30 tw-to-iron-800/50",
      hover: "group-hover:tw-from-iron-700/60 group-hover:tw-via-iron-600/40 group-hover:tw-to-iron-700/60"
    },
    progress: {
      background: "tw-bg-gradient-to-r tw-from-iron-400/20 tw-via-iron-300/30 tw-to-iron-400/20",
      glow: "tw-shadow-[0_0_15px_rgba(255,255,255,0.05)]"
    },
    thumb: {
      border: "tw-border-iron-500/50",
      glow: "after:tw-shadow-[0_0_12px_rgba(255,255,255,0.1)]",
      hover: "group-hover:tw-border-iron-400/60"
    },
    tooltip: {
      background: "tw-bg-gradient-to-b tw-from-iron-800 tw-to-iron-900",
      text: "tw-text-iron-300"
    }
  }
} as const; 
