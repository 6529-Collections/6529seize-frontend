import type { ApiOgMetadataDrop } from "@/generated/models/ApiOgMetadataDrop";
import {
  getMediaProxyUrl,
  getUsableText,
} from "@/app/api/og-metadata/_lib/imageUtils";
import {
  ATTACHMENT_ROW_BOTTOM_MARGIN,
  ATTACHMENT_ROWS_WITH_MEDIA,
  ATTACHMENT_ROWS_WITHOUT_MEDIA,
  CONTENT_FONT_SIZE,
  CONTENT_LINE_HEIGHT,
  CONTENT_MAX_LINES_WITH_MEDIA,
  CONTENT_MAX_LINES_WITHOUT_MEDIA,
  CONTENT_WIDTH,
  HORIZONTAL_MARGIN,
  LINK_TEXT,
  MUTED_TEXT,
} from "./constants";
import {
  getFileLines,
  getImageMediaAssets,
  getVideoLines,
  getVisibleAttachmentLines,
} from "./attachments";
import {
  getAttachmentLineTopMargin,
  getContentLineColor,
  getContentLines,
  getContentTop,
  getDropText,
  getNonBlankContentLineCount,
  isAttachmentLine,
} from "./contentLines";
import { FileContentIcon, VideoContentIcon } from "./components";
import { getMediaPresentation, shouldShowMedia } from "./mediaPresentation";
import type {
  DropContentLine,
  DropContentLineSegment,
  DropMediaPresentation,
  DropMediaTile,
  GalleryDropMediaPresentation,
  KeyedContentLineRow,
  SingleDropMediaPresentation,
} from "./types";

const getContentLineRows = (
  contentLines: readonly DropContentLine[]
): readonly KeyedContentLineRow[] => {
  const countsByBaseKey = new Map<string, number>();
  return contentLines.map((line, lineIndex) => {
    const baseKey = `${line.kind}-${line.text}`;
    const count = (countsByBaseKey.get(baseKey) ?? 0) + 1;
    countsByBaseKey.set(baseKey, count);

    return {
      key: `${baseKey}-${count}`,
      line,
      previousLine: contentLines[lineIndex - 1],
    };
  });
};

const getContentSegmentColor = (segment: DropContentLineSegment): string =>
  segment.kind === "reference" ? LINK_TEXT : "#ffffff";

const getContentLineSegments = (
  line: DropContentLine
): readonly DropContentLineSegment[] =>
  line.segments ?? [{ kind: "text", text: line.text }];

const DropContentLines = ({
  contentLines,
  contentTop,
  shouldCenterContent,
}: {
  readonly contentLines: readonly DropContentLine[];
  readonly contentTop: number;
  readonly shouldCenterContent: boolean;
}) => {
  if (contentLines.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        color: "#ffffff",
        alignItems: shouldCenterContent ? "center" : "flex-start",
        display: "flex",
        flexDirection: "column",
        fontSize: CONTENT_FONT_SIZE,
        fontWeight: 500,
        left: HORIZONTAL_MARGIN,
        letterSpacing: 0,
        lineHeight: CONTENT_LINE_HEIGHT,
        position: "absolute",
        top: contentTop,
        width: CONTENT_WIDTH,
      }}
    >
      {getContentLineRows(contentLines).map(({ key, line, previousLine }) => (
        <div
          key={key}
          style={{
            alignItems: "center",
            color: getContentLineColor(line.kind),
            display: "flex",
            lineHeight: CONTENT_LINE_HEIGHT,
            marginBottom: isAttachmentLine(line)
              ? ATTACHMENT_ROW_BOTTOM_MARGIN
              : 0,
            marginTop: getAttachmentLineTopMargin(line, previousLine),
            minHeight:
              line.text === "" ? CONTENT_FONT_SIZE * CONTENT_LINE_HEIGHT : 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            width: shouldCenterContent ? "auto" : CONTENT_WIDTH,
          }}
        >
          {line.kind === "video" ? <VideoContentIcon /> : null}
          {line.kind === "file" ? <FileContentIcon /> : null}
          {line.segments
            ? getContentLineSegments(line).map((segment, segmentIndex) => (
                <span
                  key={`${key}-${segmentIndex}`}
                  style={{ color: getContentSegmentColor(segment) }}
                >
                  {segment.text}
                </span>
              ))
            : line.text}
        </div>
      ))}
    </div>
  );
};

const SingleDropMedia = ({
  mediaPresentation,
  singleMediaUrl,
}: {
  readonly mediaPresentation: DropMediaPresentation | null;
  readonly singleMediaUrl: string | null;
}) => {
  if (mediaPresentation?.kind !== "single") {
    return null;
  }

  const presentation: SingleDropMediaPresentation = mediaPresentation;

  return (
    <div
      style={{
        alignItems: "center",
        background: "transparent",
        borderBottomLeftRadius: presentation.layout.crop ? 0 : 28,
        borderBottomRightRadius: presentation.layout.crop ? 0 : 28,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        display: "flex",
        height: presentation.layout.frameHeight,
        justifyContent: "center",
        left: presentation.layout.frameLeft,
        overflow: "hidden",
        position: "absolute",
        top: presentation.layout.frameTop,
        width: presentation.layout.frameWidth,
      }}
    >
      {singleMediaUrl ? (
        <img
          alt=""
          height={presentation.layout.imageHeight}
          src={singleMediaUrl}
          style={{
            height: presentation.layout.imageHeight,
            objectFit: presentation.layout.crop ? "cover" : "contain",
            objectPosition: "top center",
            width: presentation.layout.imageWidth,
          }}
          width={presentation.layout.imageWidth}
        />
      ) : (
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
            color: MUTED_TEXT,
            display: "flex",
            fontSize: 30,
            fontWeight: 600,
            height: presentation.layout.frameHeight,
            justifyContent: "center",
            width: presentation.layout.frameWidth,
          }}
        >
          Video
        </div>
      )}
    </div>
  );
};

const getMediaTileKey = (tile: DropMediaTile): string =>
  tile.item.sourceUrl ??
  `${tile.layout.frameLeft}-${tile.layout.frameTop}-${tile.layout.frameWidth}-${tile.layout.frameHeight}`;

const DropMediaGallery = ({
  mediaPresentation,
  origin,
}: {
  readonly mediaPresentation: DropMediaPresentation | null;
  readonly origin: string;
}) => {
  if (mediaPresentation?.kind !== "gallery") {
    return null;
  }

  const presentation: GalleryDropMediaPresentation = mediaPresentation;

  return (
    <div
      style={{
        display: "flex",
        height: presentation.frameHeight,
        left: presentation.frameLeft,
        position: "absolute",
        top: presentation.frameTop,
        width: presentation.frameWidth,
      }}
    >
      {presentation.tiles.map((tile) => {
        const tileMediaUrl = tile.item.sourceUrl
          ? getMediaProxyUrl({
              sourceUrl: tile.item.sourceUrl,
              origin,
              width: tile.layout.proxyWidth,
            })
          : null;

        return (
          <div
            key={getMediaTileKey(tile)}
            style={{
              alignItems: "center",
              background: "transparent",
              borderBottomLeftRadius: tile.layout.borderBottomLeftRadius,
              borderBottomRightRadius: tile.layout.borderBottomRightRadius,
              borderTopLeftRadius: tile.layout.borderTopLeftRadius,
              borderTopRightRadius: tile.layout.borderTopRightRadius,
              display: "flex",
              height: tile.layout.frameHeight,
              justifyContent: "center",
              left: tile.layout.frameLeft,
              overflow: "hidden",
              position: "absolute",
              top: tile.layout.frameTop,
              width: tile.layout.frameWidth,
            }}
          >
            {tileMediaUrl ? (
              <img
                alt=""
                height={tile.layout.frameHeight}
                src={tileMediaUrl}
                style={{
                  height: tile.layout.frameHeight,
                  objectFit: tile.layout.objectFit,
                  objectPosition:
                    tile.layout.objectFit === "cover"
                      ? "top center"
                      : "center center",
                  width: tile.layout.frameWidth,
                }}
                width={tile.layout.frameWidth}
              />
            ) : (
              <div
                style={{
                  alignItems: "center",
                  background:
                    "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
                  color: MUTED_TEXT,
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 600,
                  height: tile.layout.frameHeight,
                  justifyContent: "center",
                  width: tile.layout.frameWidth,
                }}
              >
                Video
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const getChatDropOgImageModel = ({
  drop,
  id,
  origin,
}: {
  readonly drop: ApiOgMetadataDrop | undefined;
  readonly id: string;
  readonly origin: string;
}) => {
  const dropText = getDropText(drop, id);
  const hasText =
    getUsableText(drop?.content ?? drop?.description ?? drop?.title) !== null;
  const attachmentLines = [
    ...getVideoLines(drop?.media),
    ...getFileLines(drop?.files),
  ];
  const textLinesWithoutMedia = getContentLines({
    value: hasText ? dropText : "",
    maxLines: CONTENT_MAX_LINES_WITHOUT_MEDIA,
  });
  const mediaAssets = getImageMediaAssets(drop?.media);
  const showMedia = shouldShowMedia({
    mediaAssets,
    textLinesWithoutMedia,
    hasText,
  });
  const maxContentLines = showMedia
    ? CONTENT_MAX_LINES_WITH_MEDIA
    : CONTENT_MAX_LINES_WITHOUT_MEDIA;
  const visibleAttachmentLines = getVisibleAttachmentLines({
    attachmentLines,
    maxAttachmentRows: showMedia
      ? ATTACHMENT_ROWS_WITH_MEDIA
      : ATTACHMENT_ROWS_WITHOUT_MEDIA,
  });
  const textLineBudget = Math.max(
    0,
    maxContentLines - visibleAttachmentLines.length
  );
  const contentLines = [
    ...getContentLines({
      value: hasText ? dropText : "",
      maxLines: textLineBudget,
    }),
    ...visibleAttachmentLines.slice(0, maxContentLines),
  ];
  const hasAttachments = contentLines.some(isAttachmentLine);
  const shouldCenterContent =
    !showMedia &&
    !hasAttachments &&
    getNonBlankContentLineCount(contentLines) <= 4;
  const mediaPresentation = showMedia
    ? getMediaPresentation({
        mediaAssets,
        textLineCount: contentLines.length,
      })
    : null;
  const singleMediaUrl =
    mediaPresentation?.kind === "single" && mediaPresentation.item.sourceUrl
      ? getMediaProxyUrl({
          sourceUrl: mediaPresentation.item.sourceUrl,
          origin,
          width: mediaPresentation.layout.proxyWidth,
        })
      : null;

  return {
    contentLines,
    contentTop: getContentTop({
      lineCount: contentLines.length,
      showMedia,
    }),
    mediaPresentation,
    shouldCenterContent,
    singleMediaUrl,
  };
};

export {
  DropContentLines,
  DropMediaGallery,
  SingleDropMedia,
  getChatDropOgImageModel,
};
