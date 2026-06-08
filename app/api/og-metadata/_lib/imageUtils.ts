import type { ApiOgMediaAsset } from "@/generated/models/ApiOgMediaAsset";

const MEDIA_PROXY_PATH = "/api/og-metadata/image";

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

export const getUsableText = (
  value: string | null | undefined
): string | null => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

export const getFirstMediaUrl = (
  media: readonly ApiOgMediaAsset[] | null | undefined
): string | null =>
  media?.find((asset) => getUsableText(asset.url) !== null)?.url ?? null;

export const getMediaProxyUrl = ({
  sourceUrl,
  origin,
  width,
}: {
  readonly sourceUrl: string | null;
  readonly origin: string;
  readonly width: number;
}): string | null => {
  if (!sourceUrl) {
    return null;
  }

  const proxyUrl = new URL(MEDIA_PROXY_PATH, origin);
  proxyUrl.searchParams.set("url", sourceUrl);
  proxyUrl.searchParams.set("w", `${width}`);
  return proxyUrl.toString();
};

export const shortenAddress = (address: string): string => {
  if (address.length <= 13) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatInteger = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
};

export const pluralize = (
  count: number,
  singular: string,
  plural: string
): string => (count === 1 ? singular : plural);

export const truncateText = (value: string, maxLength: number): string =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;

const getEstimatedTextWidth = (value: string, fontSize: number): number =>
  [...value].reduce(
    (width, character) => width + getCharacterWidthFactor(character) * fontSize,
    0
  );

const fitsLine = ({
  value,
  fontSize,
  wrapWidth,
}: {
  readonly value: string;
  readonly fontSize: number;
  readonly wrapWidth: number;
}): boolean => getEstimatedTextWidth(value, fontSize) <= wrapWidth;

const appendEllipsis = ({
  value,
  fontSize,
  wrapWidth,
}: {
  readonly value: string;
  readonly fontSize: number;
  readonly wrapWidth: number;
}): string => {
  const suffix = "...";
  if (value.endsWith(suffix)) {
    return value;
  }

  if (fitsLine({ value: `${value}${suffix}`, fontSize, wrapWidth })) {
    return `${value}${suffix}`;
  }

  let truncated = value.trimEnd();
  while (
    truncated.length > 0 &&
    !fitsLine({ value: `${truncated}${suffix}`, fontSize, wrapWidth })
  ) {
    truncated = truncated.slice(0, -1).trimEnd();
  }

  return `${truncated}${suffix}`;
};

const truncateWordToLine = ({
  word,
  fontSize,
  wrapWidth,
}: {
  readonly word: string;
  readonly fontSize: number;
  readonly wrapWidth: number;
}): string => {
  let truncated = word;
  while (
    truncated.length > 0 &&
    !fitsLine({ value: truncated, fontSize, wrapWidth })
  ) {
    truncated = truncated.slice(0, -1);
  }

  return appendEllipsis({ value: truncated, fontSize, wrapWidth });
};

const hasReachedMaxLines = (
  lines: readonly string[],
  maxLines: number | undefined
): boolean => maxLines !== undefined && lines.length === maxLines;

const addOverflowingWord = ({
  lines,
  currentLine,
  word,
  fontSize,
  wrapWidth,
  ellipsize,
}: {
  readonly lines: string[];
  readonly currentLine: string;
  readonly word: string;
  readonly fontSize: number;
  readonly wrapWidth: number;
  readonly ellipsize: boolean;
}): string => {
  if (currentLine) {
    lines.push(currentLine);
    return word;
  }

  if (!ellipsize) {
    return word;
  }

  lines.push(truncateWordToLine({ word, fontSize, wrapWidth }));
  return "";
};

const addTrailingEllipsis = ({
  lines,
  fontSize,
  wrapWidth,
}: {
  readonly lines: string[];
  readonly fontSize: number;
  readonly wrapWidth: number;
}): void => {
  const lastLine = lines.at(-1);
  if (!lastLine) {
    return;
  }

  lines.splice(
    -1,
    1,
    appendEllipsis({
      value: lastLine,
      fontSize,
      wrapWidth,
    })
  );
};

export const getWrappedTextLines = ({
  value,
  fontSize,
  wrapWidth,
  maxLines,
  ellipsize,
}: {
  readonly value: string | null | undefined;
  readonly fontSize: number;
  readonly wrapWidth: number;
  readonly maxLines?: number;
  readonly ellipsize: boolean;
}): readonly string[] => {
  const normalized = getUsableText(value)?.replace(/\s+/g, " ");
  if (!normalized) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of normalized.split(" ")) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (fitsLine({ value: nextLine, fontSize, wrapWidth })) {
      currentLine = nextLine;
      continue;
    }

    currentLine = addOverflowingWord({
      lines,
      currentLine,
      word,
      fontSize,
      wrapWidth,
      ellipsize,
    });

    if (hasReachedMaxLines(lines, maxLines)) {
      break;
    }
  }

  if (currentLine && (maxLines === undefined || lines.length < maxLines)) {
    lines.push(currentLine);
  }

  const shouldTruncate = lines.join(" ").length < normalized.length;
  if (ellipsize && shouldTruncate && lines.length > 0) {
    addTrailingEllipsis({ lines, fontSize, wrapWidth });
  }

  return lines.length > 0 ? lines : [normalized];
};
