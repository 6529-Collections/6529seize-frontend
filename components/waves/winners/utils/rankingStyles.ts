export const rankColors = {
  1: {
    text: "tw-text-[#E8D48A]",
    bg: "tw-bg-[#E8D48A]/20",
    ring: "tw-ring-[#E8D48A]/40",
    shadow: "tw-shadow-[0_4px_12px_rgba(232,212,138,0.2)]",
    hover:
      "desktop-hover:hover:tw-from-[#E8D48A]/40 desktop-hover:hover:tw-ring-[#E8D48A]/50",
    dropShadow: "tw-drop-shadow-[0_2px_3px_rgba(232,212,138,0.4)]",
  },
  2: {
    text: "tw-text-[#DDDDDD]",
    bg: "tw-bg-[#dddddd]/20",
    ring: "tw-ring-[#dddddd]/40",
    shadow: "tw-shadow-[0_4px_12px_rgba(221,221,221,0.15)]",
    hover:
      "desktop-hover:hover:tw-from-[#dddddd]/35 desktop-hover:hover:tw-ring-[#dddddd]/50",
    dropShadow: "tw-drop-shadow-[0_2px_3px_rgba(221,221,221,0.4)]",
  },
  3: {
    text: "tw-text-[#CD7F32]",
    bg: "tw-bg-[#B87333]/20",
    ring: "tw-ring-[#CD7F32]/40",
    shadow: "tw-shadow-[0_4px_12px_rgba(205,127,50,0.15)]",
    hover:
      "desktop-hover:hover:tw-from-[#CD7F32]/35 desktop-hover:hover:tw-ring-[#CD7F32]/50",
    dropShadow: "tw-drop-shadow-[0_2px_3px_rgba(205,127,50,0.4)]",
  },
} as const;

export const rankGradients = {
  1: "tw-from-[#E8D48A]/30 tw-via-[#D9A962]/30 tw-to-[#E8D48A]/30 desktop-hover:hover:tw-from-[#E8D48A]/40 desktop-hover:hover:tw-via-[#D9A962]/40 desktop-hover:hover:tw-to-[#E8D48A]/40 desktop-hover:hover:tw-shadow-[0_0_48px_rgba(232,212,138,0.15)]",
  2: "tw-from-[#DDDDDD]/30 tw-via-[#C0C0C0]/30 tw-to-[#DDDDDD]/30 desktop-hover:hover:tw-from-[#DDDDDD]/40 desktop-hover:hover:tw-via-[#C0C0C0]/40 desktop-hover:hover:tw-to-[#DDDDDD]/40 desktop-hover:hover:tw-shadow-[0_0_48px_rgba(221,221,221,0.15)]",
  3: "tw-from-[#CD7F32]/30 tw-via-[#B87333]/30 tw-to-[#CD7F32]/30 desktop-hover:hover:tw-from-[#CD7F32]/40 desktop-hover:hover:tw-via-[#B87333]/40 desktop-hover:hover:tw-to-[#CD7F32]/40 desktop-hover:hover:tw-shadow-[0_0_48px_rgba(205,127,50,0.15)]",
  default:
    "tw-from-iron-800 tw-via-iron-800 tw-to-iron-800 hover:tw-from-iron-700 hover:tw-via-iron-700 hover:tw-to-iron-700",
} as const;

export const getRankGradientClasses = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        gradient:
          "tw-from-[#E8D48A]/[0.02] tw-via-[#E8D48A]/[0.01] tw-to-transparent",
        borderTop: "tw-via-[#E8D48A]/25 tw-to-transparent",
        borderSide:
          "tw-from-[#E8D48A]/30 tw-via-[#E8D48A]/20 tw-to-transparent",
      };
    case 2:
      return {
        gradient:
          "tw-from-[#DDDDDD]/[0.02] tw-via-[#DDDDDD]/[0.01] tw-to-transparent",
        borderTop: "tw-via-[#DDDDDD]/25 tw-to-transparent",
        borderSide:
          "tw-from-[#DDDDDD]/30 tw-via-[#DDDDDD]/20 tw-to-transparent",
      };
    case 3:
      return {
        gradient:
          "tw-from-[#CD7F32]/[0.02] tw-via-[#CD7F32]/[0.01] tw-to-transparent",
        borderTop: "tw-via-[#CD7F32]/25 tw-to-transparent",
        borderSide:
          "tw-from-[#CD7F32]/30 tw-via-[#CD7F32]/20 tw-to-transparent",
      };
    default:
      return {
        gradient: "",
        borderTop: "",
        borderSide: "",
      };
  }
};