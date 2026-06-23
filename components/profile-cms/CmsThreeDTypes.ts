import type { CmsRoomPreset } from "@/lib/profile-cms/runtime/threeD";

export type CmsThreeDAsset = {
  readonly id: string;
  readonly alt: string;
  readonly fileSizeBytes?: number | undefined;
  readonly height?: number | undefined;
  readonly mimeType?: string | undefined;
  readonly title?: string | undefined;
  readonly url: string;
  readonly width?: number | undefined;
};

export type CmsThreeDPlacement = {
  readonly id: string;
  readonly asset: CmsThreeDAsset;
  readonly detailHref: string;
  readonly displayMode: "faithful" | "gallery";
  readonly label: string;
  readonly position?: readonly [number, number, number] | undefined;
  readonly rotation?: readonly [number, number, number] | undefined;
  readonly size?: readonly [number, number] | undefined;
};

export type CmsThreeDObjectConfig = {
  readonly asset: CmsThreeDAsset;
  readonly budgetBytes?: number | undefined;
  readonly description: string;
  readonly kind: "object";
  readonly poster?: CmsThreeDAsset | undefined;
  readonly requiresActivation: boolean;
  readonly sourceHref?: string | undefined;
  readonly title: string;
};

export type CmsThreeDRoomConfig = {
  readonly budgetBytes?: number | undefined;
  readonly description: string;
  readonly fallbackHref?: string | undefined;
  readonly kind: "room";
  readonly placements: readonly CmsThreeDPlacement[];
  readonly poster?: CmsThreeDAsset | undefined;
  readonly preset: CmsRoomPreset;
  readonly requiresActivation: boolean;
  readonly title: string;
};

export type CmsThreeDViewerConfig = CmsThreeDObjectConfig | CmsThreeDRoomConfig;
