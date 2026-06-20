const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/g;
const MARKDOWN_LINK_REGEX =
  /(!?)\[([^\]\n]*)]\(\s*(<[^>\n]+>|[^\s)\n]+)(?:\s+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?\s*\)/g;
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

const collectMarkdownLinkCandidates = (
  text: string
): MarkdownLinkCandidate[] => {
  const candidates: MarkdownLinkCandidate[] = [];
  const markdownLinkRegex = resetGlobalRegex(MARKDOWN_LINK_REGEX);

  for (const match of text.matchAll(markdownLinkRegex)) {
    const bang = match[1] ?? "";
    const label = match[2] ?? "";
    const url = match[3];
    if (typeof url !== "string" || !url.trim()) {
      continue;
    }

    const baseIndex = match.index;
    const urlOffset = match[0].indexOf(url);
    candidates.push({
      end: baseIndex + match[0].length,
      index: baseIndex + Math.max(urlOffset, 0),
      isImage: bang === "!",
      label,
      start: baseIndex,
      url,
    });
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
  const remainder = `${trimmed.slice(0, imageCandidate.start)}${trimmed.slice(
    imageCandidate.end
  )}`;

  if (remainder.trim()) {
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

  const markdownLinkRegex = resetGlobalRegex(MARKDOWN_LINK_REGEX);
  let result = content.replace(
    markdownLinkRegex,
    (
      match,
      bang: string | undefined,
      label: string | undefined,
      url: string | undefined
    ) => {
      if (bang === "!") {
        return match;
      }

      const normalized =
        typeof url === "string" ? normalizeUrlCandidate(url) : null;
      if (normalized && normalized === normalizedTarget) {
        return label ?? "";
      }
      return match;
    }
  );

  const urlRegex = resetGlobalRegex(URL_REGEX);
  result = result.replace(urlRegex, (match) => {
    const normalized = normalizeUrlCandidate(match);
    return normalized && normalized === normalizedTarget ? "" : match;
  });

  return result;
};
