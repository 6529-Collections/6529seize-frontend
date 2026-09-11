import type { ApiOgMediaAsset } from "@/generated/models/ApiOgMediaAsset";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import {
  CANVAS_HEIGHT,
  CONTENT_FONT_SIZE,
  CONTENT_LINE_HEIGHT,
  CONTENT_TOP,
  CONTENT_WIDTH,
  HORIZONTAL_MARGIN,
  LONG_TEXT_MEDIA_THRESHOLD_LINES,
  MEDIA_BOTTOM_MARGIN,
  MEDIA_GALLERY_GAP,
  MEDIA_GALLERY_MAX_ITEMS,
  MEDIA_GAP,
  MEDIA_MIN_HEIGHT,
} from "./constants";
import type {
  DropContentLine,
  DropMediaItem,
  DropMediaLayout,
  DropMediaPresentation,
  DropMediaTile,
  DropMediaTileLayout,
} from "./types";

const getMediaItem = (asset: ApiOgMediaAsset): DropMediaItem => ({
  asset,
  sourceUrl: getUsableText(asset.url),
});

const shouldShowMedia = ({
  mediaAssets,
  textLinesWithoutMedia,
  hasText,
}: {
  readonly mediaAssets: readonly ApiOgMediaAsset[];
  readonly textLinesWithoutMedia: readonly DropContentLine[];
  readonly hasText: boolean;
}): boolean =>
  mediaAssets.length > 0 &&
  (!hasText || textLinesWithoutMedia.length <= LONG_TEXT_MEDIA_THRESHOLD_LINES);

const isPositiveDimension = (
  value: number | null | undefined
): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const getMediaTop = (textLineCount: number): number =>
  CONTENT_TOP +
  textLineCount * CONTENT_FONT_SIZE * CONTENT_LINE_HEIGHT +
  (textLineCount > 0 ? MEDIA_GAP : 0);

const getAvailableMediaHeight = (top: number): number =>
  Math.max(MEDIA_MIN_HEIGHT, CANVAS_HEIGHT - top - MEDIA_BOTTOM_MARGIN);

const centerMediaLeft = (width: number): number =>
  HORIZONTAL_MARGIN + (CONTENT_WIDTH - width) / 2;

const roundLayoutValue = (value: number): number => Math.round(value);

const getUnknownDimensionMediaLayout = (
  textLineCount: number
): DropMediaLayout => {
  const frameTop = getMediaTop(textLineCount);
  const frameHeight = getAvailableMediaHeight(frameTop);

  return {
    crop: false,
    frameHeight: roundLayoutValue(frameHeight),
    frameLeft: HORIZONTAL_MARGIN,
    frameTop: roundLayoutValue(frameTop),
    frameWidth: CONTENT_WIDTH,
    imageHeight: roundLayoutValue(frameHeight),
    imageWidth: CONTENT_WIDTH,
    proxyWidth: CONTENT_WIDTH,
  };
};

const getContainedSingleMediaLayout = ({
  availableHeight,
  frameTop,
  naturalHeight,
  naturalWidth,
}: {
  readonly availableHeight: number;
  readonly frameTop: number;
  readonly naturalHeight: number;
  readonly naturalWidth: number;
}): DropMediaLayout => {
  if (naturalWidth <= CONTENT_WIDTH && naturalHeight <= availableHeight) {
    return {
      crop: false,
      frameHeight: roundLayoutValue(naturalHeight),
      frameLeft: roundLayoutValue(centerMediaLeft(naturalWidth)),
      frameTop: roundLayoutValue(frameTop),
      frameWidth: roundLayoutValue(naturalWidth),
      imageHeight: roundLayoutValue(naturalHeight),
      imageWidth: roundLayoutValue(naturalWidth),
      proxyWidth: Math.round(naturalWidth),
    };
  }

  const scale = Math.min(
    CONTENT_WIDTH / naturalWidth,
    availableHeight / naturalHeight,
    1
  );
  const imageWidth = naturalWidth * scale;
  const imageHeight = naturalHeight * scale;

  return {
    crop: false,
    frameHeight: roundLayoutValue(imageHeight),
    frameLeft: roundLayoutValue(centerMediaLeft(imageWidth)),
    frameTop: roundLayoutValue(frameTop),
    frameWidth: roundLayoutValue(imageWidth),
    imageHeight: roundLayoutValue(imageHeight),
    imageWidth: roundLayoutValue(imageWidth),
    proxyWidth: Math.round(imageWidth),
  };
};

const getSingleMediaLayout = (
  textLineCount: number,
  mediaAsset: ApiOgMediaAsset
): DropMediaLayout => {
  const frameTop = getMediaTop(textLineCount);
  const availableHeight = getAvailableMediaHeight(frameTop);
  const naturalWidth = mediaAsset.width;
  const naturalHeight = mediaAsset.height;

  if (
    !isPositiveDimension(naturalWidth) ||
    !isPositiveDimension(naturalHeight)
  ) {
    return getUnknownDimensionMediaLayout(textLineCount);
  }

  return getContainedSingleMediaLayout({
    availableHeight,
    frameTop,
    naturalHeight,
    naturalWidth,
  });
};

const getTileObjectFit = (
  tile: Pick<DropMediaTileLayout, "frameHeight" | "frameWidth">,
  asset: ApiOgMediaAsset
): "contain" | "cover" => {
  const naturalWidth = asset.width;
  const naturalHeight = asset.height;

  if (
    !isPositiveDimension(naturalWidth) ||
    !isPositiveDimension(naturalHeight)
  ) {
    return "contain";
  }

  if (naturalWidth <= tile.frameWidth && naturalHeight <= tile.frameHeight) {
    return "contain";
  }

  return "cover";
};

const withTileFit = (
  layout: Omit<DropMediaTileLayout, "objectFit" | "proxyWidth">,
  item: DropMediaItem
): DropMediaTile => ({
  item,
  layout: {
    borderBottomLeftRadius: layout.borderBottomLeftRadius,
    borderBottomRightRadius: layout.borderBottomRightRadius,
    borderTopLeftRadius: layout.borderTopLeftRadius,
    borderTopRightRadius: layout.borderTopRightRadius,
    frameHeight: roundLayoutValue(layout.frameHeight),
    frameLeft: roundLayoutValue(layout.frameLeft),
    frameTop: roundLayoutValue(layout.frameTop),
    frameWidth: roundLayoutValue(layout.frameWidth),
    objectFit: getTileObjectFit(layout, item.asset),
    proxyWidth: Math.round(layout.frameWidth),
  },
});

const getGalleryTiles = ({
  items,
  mediaHeight,
  mediaWidth,
}: {
  readonly items: readonly DropMediaItem[];
  readonly mediaHeight: number;
  readonly mediaWidth: number;
}): readonly DropMediaTile[] => {
  const gap = MEDIA_GALLERY_GAP;

  if (items.length === 2) {
    const tileWidth = (mediaWidth - gap) / 2;
    return items.map((item, index) =>
      withTileFit(
        {
          borderBottomLeftRadius: index === 0 ? 28 : 0,
          borderBottomRightRadius: index === 1 ? 28 : 0,
          borderTopLeftRadius: index === 0 ? 28 : 0,
          borderTopRightRadius: index === 1 ? 28 : 0,
          frameHeight: mediaHeight,
          frameLeft: index * (tileWidth + gap),
          frameTop: 0,
          frameWidth: tileWidth,
        },
        item
      )
    );
  }

  if (items.length === 3) {
    const [first, second, third] = items;
    if (!first || !second || !third) {
      return [];
    }

    const tileWidth = (mediaWidth - gap) / 2;
    const stackedHeight = (mediaHeight - gap) / 2;

    return [
      withTileFit(
        {
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 0,
          frameHeight: mediaHeight,
          frameLeft: 0,
          frameTop: 0,
          frameWidth: tileWidth,
        },
        first
      ),
      withTileFit(
        {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 28,
          frameHeight: stackedHeight,
          frameLeft: tileWidth + gap,
          frameTop: 0,
          frameWidth: tileWidth,
        },
        second
      ),
      withTileFit(
        {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 28,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          frameHeight: stackedHeight,
          frameLeft: tileWidth + gap,
          frameTop: stackedHeight + gap,
          frameWidth: tileWidth,
        },
        third
      ),
    ];
  }

  const tileWidth = (mediaWidth - gap) / 2;
  const tileHeight = (mediaHeight - gap) / 2;

  return items.slice(0, MEDIA_GALLERY_MAX_ITEMS).map((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);

    return withTileFit(
      {
        borderBottomLeftRadius: index === 2 ? 28 : 0,
        borderBottomRightRadius: index === 3 ? 28 : 0,
        borderTopLeftRadius: index === 0 ? 28 : 0,
        borderTopRightRadius: index === 1 ? 28 : 0,
        frameHeight: tileHeight,
        frameLeft: column * (tileWidth + gap),
        frameTop: row * (tileHeight + gap),
        frameWidth: tileWidth,
      },
      item
    );
  });
};

const getMediaPresentation = ({
  mediaAssets,
  textLineCount,
}: {
  readonly mediaAssets: readonly ApiOgMediaAsset[];
  readonly textLineCount: number;
}): DropMediaPresentation | null => {
  if (mediaAssets.length === 0) {
    return null;
  }

  const items = mediaAssets.map(getMediaItem);
  if (items.length === 1) {
    const [item] = items;
    if (!item) {
      return null;
    }

    return {
      kind: "single",
      item,
      layout: getSingleMediaLayout(textLineCount, item.asset),
    };
  }

  const frameTop = getMediaTop(textLineCount);
  const frameHeight = getAvailableMediaHeight(frameTop);

  return {
    frameHeight,
    frameLeft: HORIZONTAL_MARGIN,
    frameTop,
    frameWidth: CONTENT_WIDTH,
    kind: "gallery",
    tiles: getGalleryTiles({
      items,
      mediaHeight: frameHeight,
      mediaWidth: CONTENT_WIDTH,
    }),
  };
};

export { getMediaPresentation, shouldShowMedia };
