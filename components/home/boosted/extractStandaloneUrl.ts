const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/g;
const resetGlobalRegex = (regex: RegExp): RegExp => {
  regex.lastIndex = 0;
  return regex;
};

const stripDestinationWrappers = (destination: string): string => {
  const trimmed = destination.trim();

  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const normalizeUrlCandidate = (candidate: string): string | null => {
  const trimmed = stripDestinationWrappers(candidate);
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
};

type UrlCandidate = {
  readonly url: string;
  readonly index: number;
};

type MarkdownLinkCandidate = UrlCandidate & {
  readonly end: number;
  readonly isImage: boolean;
  readonly label: string;
  readonly start: number;
};

type MarkdownImage = {
  readonly alt: string;
  readonly url: string;
};

type MarkdownDestination = {
  readonly destination: string;
  readonly end: number;
  readonly index: number;
};

const isHorizontalWhitespace = (value: string | undefined): boolean =>
  value === " " || value === "\t";

const skipHorizontalWhitespace = (text: string, index: number): number => {
  let cursor = index;

  while (isHorizontalWhitespace(text[cursor])) {
    cursor += 1;
  }

  return cursor;
};

const findMarkdownLabelEnd = (text: string, openIndex: number): number => {
  for (let cursor = openIndex + 1; cursor < text.length; cursor += 1) {
    const value = text[cursor];

    if (value === "\n") {
      return -1;
    }

    if (value === "]") {
      return cursor;
    }
  }

  return -1;
};

const readMarkdownTitleEnd = (
  text: string,
  titleStartIndex: number
): number | null => {
  let cursor = skipHorizontalWhitespace(text, titleStartIndex);
  const opener = text[cursor];

  if (opener === '"' || opener === "'") {
    cursor += 1;

    while (cursor < text.length) {
      const value = text[cursor];

      if (value === "\n") {
        return null;
      }

      if (value === opener) {
        cursor += 1;
        cursor = skipHorizontalWhitespace(text, cursor);
        return text[cursor] === ")" ? cursor + 1 : null;
      }

      cursor += 1;
    }

    return null;
  }

  if (opener === "(") {
    cursor += 1;

    while (cursor < text.length) {
      const value = text[cursor];

      if (value === "\n") {
        return null;
      }

      if (value === ")") {
        cursor += 1;
        cursor = skipHorizontalWhitespace(text, cursor);
        return text[cursor] === ")" ? cursor + 1 : null;
      }

      cursor += 1;
    }
  }

  return null;
};

const readMarkdownDestination = (
  text: string,
  destinationStartIndex: number
): MarkdownDestination | null => {
  let cursor = skipHorizontalWhitespace(text, destinationStartIndex);
  const destinationIndex = cursor;

  if (cursor >= text.length || text[cursor] === ")" || text[cursor] === "\n") {
    return null;
  }

  if (text[cursor] === "<") {
    cursor += 1;

    while (cursor < text.length && text[cursor] !== ">") {
      if (text[cursor] === "\n") {
        return null;
      }
      cursor += 1;
    }

    if (text[cursor] !== ">") {
      return null;
    }

    cursor += 1;
  } else {
    while (cursor < text.length) {
      const value = text[cursor];

      if (value === ")" || value === "\n" || isHorizontalWhitespace(value)) {
        break;
      }

      cursor += 1;
    }
  }

  if (cursor === destinationIndex) {
    return null;
  }

  const destination = text.slice(destinationIndex, cursor);
  cursor = skipHorizontalWhitespace(text, cursor);

  if (text[cursor] === ")") {
    return {
      destination,
      end: cursor + 1,
      index: destinationIndex,
    };
  }

  const titleEnd = readMarkdownTitleEnd(text, cursor);
  if (titleEnd === null) {
    return null;
  }

  return {
    destination,
    end: titleEnd,
    index: destinationIndex,
  };
};

const collectMarkdownLinkCandidates = (
  text: string
): MarkdownLinkCandidate[] => {
  const candidates: MarkdownLinkCandidate[] = [];

  for (let cursor = 0; cursor < text.length; cursor += 1) {
    const isImage = text[cursor] === "!" && text[cursor + 1] === "[";
    const labelOpenIndex = isImage ? cursor + 1 : cursor;

    if (text[labelOpenIndex] !== "[") {
      continue;
    }

    const labelEndIndex = findMarkdownLabelEnd(text, labelOpenIndex);
    if (labelEndIndex === -1 || text[labelEndIndex + 1] !== "(") {
      continue;
    }

    const destination = readMarkdownDestination(text, labelEndIndex + 2);
    if (!destination) {
      continue;
    }

    candidates.push({
      end: destination.end,
      index: destination.index,
      isImage,
      label: text.slice(labelOpenIndex + 1, labelEndIndex),
      start: isImage ? cursor : labelOpenIndex,
      url: destination.destination,
    });

    cursor = destination.end - 1;
  }

  return candidates;
};

const isIndexInsideMarkdownCandidate = (
  index: number,
  candidates: readonly MarkdownLinkCandidate[]
): boolean =>
  candidates.some(
    (candidate) => index >= candidate.start && index < candidate.end
  );

const collectUrlCandidates = (text: string): UrlCandidate[] => {
  const candidates: UrlCandidate[] = [];
  const markdownCandidates = collectMarkdownLinkCandidates(text);

  for (const candidate of markdownCandidates) {
    if (!candidate.isImage) {
      candidates.push({ index: candidate.index, url: candidate.url });
    }
  }

  const urlRegex = resetGlobalRegex(URL_REGEX);
  for (const match of text.matchAll(urlRegex)) {
    const url = match[0];
    if (
      typeof url === "string" &&
      !isIndexInsideMarkdownCandidate(match.index, markdownCandidates)
    ) {
      candidates.push({ url, index: match.index });
    }
  }

  return candidates;
};

/**
 * Returns the first URL found in the content (markdown links or raw URLs).
 */
export const extractFirstUrl = (
  content: string | null | undefined
): string | null => {
  if (!content) {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  const candidates = collectUrlCandidates(trimmed).sort(
    (a, b) => a.index - b.index
  );

  for (const candidate of candidates) {
    const normalized = normalizeUrlCandidate(candidate.url);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

/**
 * Returns a raw standalone URL when it is the only visible content.
 */
export const extractStandaloneUrl = (
  content: string | null | undefined
): string | null => {
  if (!content) {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  const candidates = collectUrlCandidates(trimmed);
  if (candidates.length !== 1) {
    return null;
  }

  const [candidate] = candidates;
  if (!candidate) {
    return null;
  }

  const normalizedUrl = normalizeUrlCandidate(candidate.url);
  if (!normalizedUrl) {
    return null;
  }

  const before = trimmed.slice(0, candidate.index);
  const after = trimmed.slice(candidate.index + candidate.url.length);
  if (before.trim() || after.trim()) {
    return null;
  }

  return normalizedUrl;
};

/**
 * Returns the first markdown image found in content.
 */
export const extractFirstMarkdownImage = (
  content: string | null | undefined
): MarkdownImage | null => {
  if (!content) {
    return null;
  }

  const imageCandidate = collectMarkdownLinkCandidates(content).find(
    (candidate) => candidate.isImage
  );
  if (!imageCandidate) {
    return null;
  }

  const normalizedUrl = normalizeUrlCandidate(imageCandidate.url);
  if (!normalizedUrl) {
    return null;
  }

  return {
    alt: imageCandidate.label.trim() || "Media",
    url: normalizedUrl,
  };
};

/**
 * Returns a single markdown image when it is the only visible content.
 */
export const extractStandaloneMarkdownImage = (
  content: string | null | undefined
): MarkdownImage | null => {
  if (!content) {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  const imageCandidates = collectMarkdownLinkCandidates(trimmed).filter(
    (candidate) => candidate.isImage
  );

  if (imageCandidates.length !== 1) {
    return null;
  }

  const imageCandidate = imageCandidates[0];
  if (!imageCandidate) {
    return null;
  }

  const remainder = `${trimmed.slice(0, imageCandidate.start)}${trimmed.slice(
    imageCandidate.end
  )}`;

  if (remainder.trim()) {
    return null;
  }

  const markdownImage = extractFirstMarkdownImage(trimmed);
  if (!markdownImage) {
    return null;
  }

  return markdownImage;
};

/**
 * Removes a matching preview URL from content while keeping markdown link labels.
 */
export const removePreviewUrlFromContent = (
  content: string | null | undefined,
  previewUrl: string | null | undefined
): string | null => {
  if (!content) {
    return content ?? null;
  }

  if (!previewUrl) {
    return content;
  }

  const normalizedTarget = normalizeUrlCandidate(previewUrl);
  if (!normalizedTarget) {
    return content;
  }

  const markdownCandidates = collectMarkdownLinkCandidates(content);
  let result = content;

  if (markdownCandidates.length > 0) {
    let cursor = 0;
    result = "";

    for (const candidate of markdownCandidates) {
      result += content.slice(cursor, candidate.start);

      const match = content.slice(candidate.start, candidate.end);
      const normalized = normalizeUrlCandidate(candidate.url);
      result +=
        !candidate.isImage && normalized === normalizedTarget
          ? candidate.label
          : match;

      cursor = candidate.end;
    }

    result += content.slice(cursor);
  }

  const urlRegex = resetGlobalRegex(URL_REGEX);
  const remainingMarkdownCandidates = collectMarkdownLinkCandidates(result);
  result = result.replace(urlRegex, (match, _url: string, offset: number) => {
    if (isIndexInsideMarkdownCandidate(offset, remainingMarkdownCandidates)) {
      return match;
    }

    const normalized = normalizeUrlCandidate(match);
    return normalized && normalized === normalizedTarget ? "" : match;
  });

  return result;
};
