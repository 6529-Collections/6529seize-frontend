import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ReactNode } from "react";

export interface DropInteractionParams {
  drop: ExtendedDrop;
  partId: number;
}

export type DropIdentityMode = "default" | "minimal" | "hidden";
export type DropTimestampLayout = "inline" | "stacked";

export const hasDropFooter = (
  footer: ReactNode | undefined
): footer is Exclude<ReactNode, boolean | null | undefined> =>
  footer !== undefined && footer !== null && footer !== false;

export enum DropLocation {
  MY_STREAM = "MY_STREAM",
  WAVE = "WAVE",
  PROFILE = "PROFILE",
}
