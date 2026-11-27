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
    label: "Granted",
    icon: faCircle,
    badgeClassName: "tw-text-green",
  },
  DISABLED: {
    label: "Revoked",
    icon: faTimes,
    badgeClassName: "tw-text-red",
  },
  PENDING: {
    label: "Pending",
    icon: faEllipsisH,
    badgeClassName: "tw-text-primary-300",
  },
  FAILED: {
    label: "Failed",
    icon: faTimes,
    badgeClassName: "tw-text-red",
  },
};

const DEFAULT_STATUS_VISUALS: StatusVisuals = {
  label: "Status",
  icon: faDotCircle,
  badgeClassName: "tw-text-iron-300",
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
        label: "Ended",
        badgeClassName: "tw-text-iron-400",
      };
    }

    if (from > now) {
      return {
        ...visuals,
        label: "Scheduled",
        badgeClassName: "tw-text-blue-200",
      };
    }

    return {
      ...visuals,
      label: "Active",
    };
  }

  return visuals;
}
