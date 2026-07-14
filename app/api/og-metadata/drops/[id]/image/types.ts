import type { SubmissionMediaCategory } from "@/constants/submission-media.constants";
import type { ApiOgMediaAsset } from "@/generated/models/ApiOgMediaAsset";

type DropMediaKind = "image" | "video";
type SubmissionPreviewMediaCategory = SubmissionMediaCategory | "unknown";
type DropContentLineKind =
  | "text"
  | "link"
  | "video"
  | "file"
  | "attachment-summary";
type DropContentSegmentKind = "text" | "reference";
type DropContentLineSegment = {
  readonly kind: DropContentSegmentKind;
  readonly text: string;
};
type DropContentLine = {
  readonly kind: DropContentLineKind;
  readonly segments?: readonly DropContentLineSegment[] | undefined;
  readonly text: string;
};
type DropContentWord = {
  readonly kind: DropContentSegmentKind;
  readonly text: string;
};
type DropMediaItem = {
  readonly asset: ApiOgMediaAsset;
  readonly sourceUrl: string | null;
};
type SubmissionPreviewMedia = {
  readonly category: SubmissionPreviewMediaCategory;
  readonly label: string;
  readonly mimeType: string | undefined;
};
type SubmissionMediaStyles = {
  readonly bg: string;
  readonly border: string;
  readonly text: string;
};
type DropMediaLayout = {
  readonly crop: boolean;
  readonly frameHeight: number;
  readonly frameLeft: number;
  readonly frameTop: number;
  readonly frameWidth: number;
  readonly imageHeight: number;
  readonly imageWidth: number;
  readonly proxyWidth: number;
};
type DropMediaTileLayout = {
  readonly borderBottomLeftRadius: number;
  readonly borderBottomRightRadius: number;
  readonly borderTopLeftRadius: number;
  readonly borderTopRightRadius: number;
  readonly frameHeight: number;
  readonly frameLeft: number;
  readonly frameTop: number;
  readonly frameWidth: number;
  readonly objectFit: "contain" | "cover";
  readonly proxyWidth: number;
};
type DropMediaTile = {
  readonly item: DropMediaItem;
  readonly layout: DropMediaTileLayout;
};
type DropMediaPresentation =
  | {
      readonly kind: "single";
      readonly item: DropMediaItem;
      readonly layout: DropMediaLayout;
    }
  | {
      readonly frameHeight: number;
      readonly frameLeft: number;
      readonly frameTop: number;
      readonly frameWidth: number;
      readonly kind: "gallery";
      readonly tiles: readonly DropMediaTile[];
    };
type SingleDropMediaPresentation = Extract<
  DropMediaPresentation,
  { readonly kind: "single" }
>;
type GalleryDropMediaPresentation = Extract<
  DropMediaPresentation,
  { readonly kind: "gallery" }
>;
type KeyedContentLineRow = {
  readonly key: string;
  readonly line: DropContentLine;
  readonly previousLine: DropContentLine | undefined;
};

export type {
  DropContentLine,
  DropContentLineKind,
  DropContentLineSegment,
  DropContentSegmentKind,
  DropContentWord,
  DropMediaItem,
  DropMediaKind,
  DropMediaLayout,
  DropMediaPresentation,
  DropMediaTile,
  DropMediaTileLayout,
  GalleryDropMediaPresentation,
  KeyedContentLineRow,
  SingleDropMediaPresentation,
  SubmissionMediaStyles,
  SubmissionPreviewMedia,
  SubmissionPreviewMediaCategory,
};
