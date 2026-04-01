const GOLD_BORDER_HOVER = "desktop-hover:hover:tw-border-amber-500/20";

const SILVER_BORDER_HOVER = "desktop-hover:hover:tw-border-[#DDDDDD]/20";

const BRONZE_BORDER_HOVER = "desktop-hover:hover:tw-border-[#CD7F32]/14";

const GOLD_RING_HOVER = "desktop-hover:hover:tw-ring-amber-500/12";

const SILVER_RING_HOVER = "desktop-hover:hover:tw-ring-[#DDDDDD]/20";

const BRONZE_RING_HOVER = "desktop-hover:hover:tw-ring-[#CD7F32]/10";

export const getRankStaticBorderClass = (rank: number | null): string => {
  switch (rank) {
    case 1:
    case 2:
    case 3:
    case null:
    default:
      return "tw-border-iron-800";
  }
};

export const getRankHoverBorderClass = (rank: number | null): string => {
  switch (rank) {
    case 1:
      return GOLD_BORDER_HOVER;
    case 2:
      return SILVER_BORDER_HOVER;
    case 3:
      return BRONZE_BORDER_HOVER;
    case null:
      return "desktop-hover:hover:tw-border-iron-700";
    default:
      return "desktop-hover:hover:tw-border-iron-700";
  }
};

export const getRankHoverRingClass = (rank: number | null): string => {
  switch (rank) {
    case 1:
      return GOLD_RING_HOVER;
    case 2:
      return SILVER_RING_HOVER;
    case 3:
      return BRONZE_RING_HOVER;
    case null:
      return "desktop-hover:hover:tw-ring-iron-600/45";
    default:
      return "desktop-hover:hover:tw-ring-iron-600/45";
  }
};
