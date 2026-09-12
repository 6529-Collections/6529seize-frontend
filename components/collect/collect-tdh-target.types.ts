import type { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";

export const TDH_TARGET_HORIZONS = [1, 30, 90, 365] as const;
export type TdhTargetHorizon = (typeof TDH_TARGET_HORIZONS)[number];
export interface CollectTdhTargetDraft {
  readonly targetTdh: string;
  readonly horizonDays: TdhTargetHorizon;
  readonly family: ApiCollectFamily;
  readonly mode: "total" | "additional";
  readonly budgetEth: string;
}
export type CollectTdhTargetField = "target" | "budget" | "recipient";
