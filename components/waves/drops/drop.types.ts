import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

export interface DropInteractionParams {
  drop: ExtendedDrop;
  partId: number;
}

export enum DropLocation {
  MY_STREAM = "MY_STREAM",
  WAVE = "WAVE",
  PROFILE = "PROFILE",
}
