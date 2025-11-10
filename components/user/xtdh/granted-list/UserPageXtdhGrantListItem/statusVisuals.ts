type KnownGrantStatus = "GRANTED" | "DISABLED" | "PENDING" | "FAILED";

interface StatusVisuals {
  readonly label: string;
  readonly glyph: string;
  readonly badgeClassName: string;
}

const STATUS_VISUALS: Record<KnownGrantStatus, StatusVisuals> = {
  GRANTED: {
    label: "GRANTED",
    glyph: "●",
    badgeClassName:
      "tw-border-green/50 tw-bg-green/10 tw-text-green tw-shadow-[0_0_20px_rgba(60,203,127,0.15)]",
  },
  DISABLED: {
    label: "DISABLED",
    glyph: "▬",
    badgeClassName:
      "tw-border-amber-400/50 tw-bg-amber-400/10 tw-text-amber-200 tw-shadow-[0_0_20px_rgba(251,191,36,0.1)]",
  },
  PENDING: {
    label: "PENDING",
    glyph: "⋯",
    badgeClassName:
      "tw-border-primary-400/50 tw-bg-primary-400/10 tw-text-primary-200 tw-shadow-[0_0_20px_rgba(82,139,255,0.15)]",
  },
  FAILED: {
    label: "FAILED",
    glyph: "✕",
    badgeClassName:
      "tw-border-red/50 tw-bg-red/10 tw-text-red tw-shadow-[0_0_20px_rgba(249,112,102,0.15)]",
  },
};

const DEFAULT_STATUS_VISUALS: StatusVisuals = {
  label: "STATUS",
  glyph: "•",
  badgeClassName:
    "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-200 tw-shadow-[0_0_12px_rgba(0,0,0,0.3)]",
};

export function getStatusVisuals(status?: string | null): StatusVisuals {
  if (!status) {
    return DEFAULT_STATUS_VISUALS;
  }

  const normalizedStatus = status.toUpperCase() as KnownGrantStatus;

  return STATUS_VISUALS[normalizedStatus] ?? DEFAULT_STATUS_VISUALS;
}
