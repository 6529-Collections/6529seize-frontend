import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircle,
  faDotCircle,
  faEllipsisH,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import type { ApiTdhGrantStatus } from "@/generated/models/ApiTdhGrantStatus";

type KnownGrantStatus = ApiTdhGrantStatus;

interface StatusVisuals {
  readonly label: string;
  readonly icon: IconDefinition;
  readonly badgeClassName: string;
}

const STATUS_VISUALS: Record<KnownGrantStatus, StatusVisuals> = {
  GRANTED: {
    label: "GRANTED",
    icon: faCircle,
    badgeClassName:
      "tw-border-green/50 tw-bg-green/10 tw-text-green tw-shadow-[0_0_20px_rgba(60,203,127,0.15)]",
  },
  DISABLED: {
    label: "REVOKED",
    icon: faTimes,
    badgeClassName:
      "tw-border-red/50 tw-bg-red/10 tw-text-red tw-shadow-[0_0_20px_rgba(249,112,102,0.15)]",
  },
  PENDING: {
    label: "PENDING",
    icon: faEllipsisH,
    badgeClassName:
      "tw-border-primary-400/50 tw-bg-primary-400/10 tw-text-primary-200 tw-shadow-[0_0_20px_rgba(82,139,255,0.15)]",
  },
  FAILED: {
    label: "FAILED",
    icon: faTimes,
    badgeClassName:
      "tw-border-red/50 tw-bg-red/10 tw-text-red tw-shadow-[0_0_20px_rgba(249,112,102,0.15)]",
  },
};

const DEFAULT_STATUS_VISUALS: StatusVisuals = {
  label: "STATUS",
  icon: faDotCircle,
  badgeClassName:
    "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-200 tw-shadow-[0_0_12px_rgba(0,0,0,0.3)]",
};

export function getStatusVisuals(status?: ApiTdhGrantStatus | null): StatusVisuals {
  if (!status) {
    return DEFAULT_STATUS_VISUALS;
  }

  const normalizedStatus = status.toUpperCase() as KnownGrantStatus;

  return STATUS_VISUALS[normalizedStatus] ?? DEFAULT_STATUS_VISUALS;
}
