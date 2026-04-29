import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

export interface DropInteractionParams {
  drop: ExtendedDrop;
  partId: number;
}

export type DropIdentityMode = "default" | "minimal" | "hidden";
export type DropTimestampLayout = "inline" | "stacked";

export enum DropLocation {
  MY_STREAM = "MY_STREAM",
  WAVE = "WAVE",
  PROFILE = "PROFILE",
}
