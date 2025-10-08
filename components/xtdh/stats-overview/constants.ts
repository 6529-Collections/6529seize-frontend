import type { CSSProperties } from "react";

import type { UserSectionState } from "./types";

export const DEFAULT_NETWORK_MULTIPLIER = 0.1;
export const DEFAULT_ACTIVE_ALLOCATIONS = 3_220;
export const DEFAULT_TOTAL_CAPACITY = 3_140;
export const DEFAULT_ALLOCATED_CAPACITY = 2_355;
export const DEFAULT_GRANTORS = 14;
export const DEFAULT_COLLECTIONS = 4;
export const DEFAULT_TOKENS = 9;

export const NEXT_MULTIPLIER_EVENT = {
  label: "Next increase in 30 days",
  value: 0.12,
};

export const MULTIPLIER_MILESTONES = [
  "30% multiplier in 36 months",
  "100% multiplier in 120 months",
] as const;

export const INFO_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "#111827",
  color: "#F9FAFB",
  padding: "8px 12px",
  borderRadius: "12px",
  maxWidth: "20rem",
  lineHeight: "1.4",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.45)",
};

export const SECTION_HEADER_CLASS =
  "tw-flex tw-min-h-[84px] tw-flex-col tw-justify-start tw-gap-1";

export const DEFAULT_USER_STATE: UserSectionState = {
  kind: "ready",
  baseTdhRate: 1_500,
  multiplier: DEFAULT_NETWORK_MULTIPLIER,
  allocatedRate: 50,
  allocationsCount: 2,
};
