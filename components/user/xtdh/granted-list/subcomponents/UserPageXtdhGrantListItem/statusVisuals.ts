import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircle,
  faDotCircle,
  faEllipsisH,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import type { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";

type KnownGrantStatus = ApiXTdhGrantStatus;

interface StatusVisuals {
  readonly label: string;
  readonly icon: IconDefinition;
  readonly badgeClassName: string;
}

const STATUS_VISUALS: Record<KnownGrantStatus, StatusVisuals> = {
  GRANTED: {
    label: "GRANTED",
    icon: faCircle,
    badgeClassName: "tw-bg-green/15 tw-text-green",
  },
  DISABLED: {
    label: "REVOKED",
    icon: faTimes,
    badgeClassName: "tw-bg-red/15 tw-text-red",
  },
  PENDING: {
    label: "PENDING",
    icon: faEllipsisH,
    badgeClassName: "tw-bg-primary-400/15 tw-text-primary-300",
  },
  FAILED: {
    label: "FAILED",
    icon: faTimes,
    badgeClassName: "tw-bg-red/15 tw-text-red",
  },
};

const DEFAULT_STATUS_VISUALS: StatusVisuals = {
  label: "STATUS",
  icon: faDotCircle,
  badgeClassName: "tw-bg-iron-700/50 tw-text-iron-300",
};

export function getStatusVisuals(
  status?: ApiXTdhGrantStatus | null,
  validFrom?: number | string | null,
  validTo?: number | string | null
): StatusVisuals {
  if (!status) {
    return DEFAULT_STATUS_VISUALS;
  }

  const normalizedStatus = status.toUpperCase() as KnownGrantStatus;
  const visuals = STATUS_VISUALS[normalizedStatus] ?? DEFAULT_STATUS_VISUALS;

  if (normalizedStatus === "GRANTED") {
    const now = Date.now();
    const from = validFrom ? new Date(validFrom).getTime() : 0;
    const to = validTo ? new Date(validTo).getTime() : null;

    if (to && to < now) {
      return {
        ...visuals,
        label: "ENDED",
        badgeClassName:
          "tw-border-iron-600/50 tw-bg-iron-600/10 tw-text-iron-400 tw-shadow-[0_0_20px_rgba(100,100,100,0.15)]",
      };
    }

    if (from > now) {
      return {
        ...visuals,
        label: "SCHEDULED",
        badgeClassName:
          "tw-border-blue-400/50 tw-bg-blue-400/10 tw-text-blue-200 tw-shadow-[0_0_20px_rgba(82,139,255,0.15)]",
      };
    }

    return {
      ...visuals,
      label: "ACTIVE",
    };
  }

  return visuals;
}
