import type { ThemeColors } from "./types";

const baseTheme = {
  1: {
    text: "tw-text-[#E8D48A]",
    ring: "tw-ring-[#E8D48A]/20",
  },
  2: {
    text: "tw-text-[#DDDDDD]",
    ring: "tw-ring-[#DDDDDD]/20",
  },
  3: {
    text: "tw-text-[#CD7F32]",
    ring: "tw-ring-[#CD7F32]/20",
  },
  default: {
    text: "tw-text-iron-300",
    ring: "tw-ring-iron-600",
  },
} as const;

export function getThemeColors(rank: number | null, isNegative: boolean): ThemeColors {
  const theme = baseTheme[rank as keyof typeof baseTheme] ?? baseTheme.default;

  if (isNegative) {
    return {
      text: `${theme.text} tw-opacity-60`,
      ring: theme.ring,
      indicator:
        "after:tw-content-[''] after:tw-absolute after:-tw-right-2 after:tw-top-1/2 after:-tw-translate-y-1/2 after:tw-w-1 after:tw-h-1 after:tw-rounded-full after:tw-bg-iron-400/40",
    };
  }

  return {
    text: theme.text,
    ring: theme.ring,
    indicator: "",
  };
} 
