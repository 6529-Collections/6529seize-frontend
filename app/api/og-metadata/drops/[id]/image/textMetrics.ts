import {
  CONTENT_FONT_SIZE,
  CONTENT_WIDTH,
  LINK_ICON,
  URL_TOKEN_PATTERN,
} from "./constants";
import type {
  DropContentLine,
  DropContentLineKind,
  DropContentLineSegment,
  DropContentSegmentKind,
} from "./types";

const getCharacterWidthFactor = (character: string): number => {
  if (character === " ") {
    return 0.34;
  }

  if ("il.,:;|'![]()".includes(character)) {
    return 0.28;
  }

  if ("mwMW@#%&".includes(character)) {
    return 0.9;
  }

  if (character >= "A" && character <= "Z") {
    return 0.72;
  }

  return 0.58;
};

const getEstimatedTextWidth = (value: string, fontSize: number): number =>
  [...value].reduce(
    (width, character) => width + getCharacterWidthFactor(character) * fontSize,
    0
  );

const truncateToWidth = ({
  fontSize,
  value,
  width,
}: {
  readonly fontSize: number;
  readonly value: string;
  readonly width: number;
}): string => {
  const suffix = "...";
  if (getEstimatedTextWidth(value, fontSize) <= width) {
    return value;
  }

  let truncated = value.trimEnd();
  while (
    truncated.length > 0 &&
    getEstimatedTextWidth(`${truncated}${suffix}`, fontSize) > width
  ) {
    truncated = truncated.slice(0, -1).trimEnd();
  }

  return `${truncated}${suffix}`;
};

const fitsContentLine = (value: string): boolean =>
  getEstimatedTextWidth(value, CONTENT_FONT_SIZE) <= CONTENT_WIDTH;

const appendContentEllipsis = (value: string): string => {
  const suffix = "...";
  if (value.endsWith(suffix)) {
    return value;
  }

  let truncated = value.trimEnd();
  while (truncated.length > 0 && !fitsContentLine(`${truncated}${suffix}`)) {
    truncated = truncated.slice(0, -1).trimEnd();
  }

  return `${truncated}${suffix}`;
};

const getFittingTokenPrefix = (value: string): string => {
  let prefix = value;
  while (prefix.length > 0 && !fitsContentLine(prefix)) {
    prefix = prefix.slice(0, -1);
  }

  return prefix || value.slice(0, 1);
};

const addHardWrappedTokenLines = ({
  lines,
  token,
  kind,
  segmentKind,
  maxLines,
}: {
  readonly lines: DropContentLine[];
  readonly token: string;
  readonly kind: DropContentLineKind;
  readonly segmentKind?: DropContentSegmentKind | undefined;
  readonly maxLines: number;
}): void => {
  let remaining = token;

  while (remaining.length > 0 && lines.length < maxLines) {
    const prefix = getFittingTokenPrefix(remaining);
    const isLastAvailableLine = lines.length === maxLines - 1;
    const hasRemainingText = prefix.length < remaining.length;
    const text =
      isLastAvailableLine && hasRemainingText
        ? appendContentEllipsis(prefix)
        : prefix;

    lines.push(
      segmentKind
        ? {
            kind,
            segments: [{ kind: segmentKind, text }],
            text,
          }
        : {
            kind,
            text,
          }
    );

    remaining = remaining.slice(prefix.length);
  }
};

const addTrailingContentEllipsis = (lines: DropContentLine[]): void => {
  const lastLine = lines.at(-1);
  if (!lastLine) {
    return;
  }

  const text = appendContentEllipsis(lastLine.text);
  const segments = lastLine.segments
    ? getSegmentsForLineText(lastLine.segments, text)
    : undefined;

  lines.splice(-1, 1, {
    ...lastLine,
    ...(segments ? { segments } : {}),
    text,
  });
};

const getSegmentsForLineText = (
  segments: readonly DropContentLineSegment[],
  text: string
): readonly DropContentLineSegment[] => {
  const nextSegments: DropContentLineSegment[] = [];
  let cursor = 0;

  for (const segment of segments) {
    if (cursor >= text.length) {
      break;
    }

    const nextCursor = Math.min(cursor + segment.text.length, text.length);
    nextSegments.push({
      ...segment,
      text: text.slice(cursor, nextCursor),
    });
    cursor = nextCursor;
  }

  if (cursor < text.length) {
    const remainingText = text.slice(cursor);
    const lastSegment = nextSegments.at(-1);
    if (lastSegment) {
      nextSegments.splice(-1, 1, {
        ...lastSegment,
        text: `${lastSegment.text}${remainingText}`,
      });
    }
  }

  return nextSegments;
};

const isUrlToken = (value: string): boolean => URL_TOKEN_PATTERN.test(value);

const getDisplayLinkText = (value: string): string => `${LINK_ICON} ${value}`;

export {
  addHardWrappedTokenLines,
  addTrailingContentEllipsis,
  fitsContentLine,
  getDisplayLinkText,
  isUrlToken,
  truncateToWidth,
};
