const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/g;
const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\(\s*(https?:\/\/[^\s)]+)\s*\)/g;
const resetGlobalRegex = (regex: RegExp): RegExp => {
  regex.lastIndex = 0;
  return regex;
};

const normalizeUrlCandidate = (candidate: string): string | null => {
  const trimmed = candidate.trim();
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

const collectUrlCandidates = (text: string): UrlCandidate[] => {
  const candidates: UrlCandidate[] = [];
  const markdownLinkRegex = resetGlobalRegex(MARKDOWN_LINK_REGEX);

  for (const match of text.matchAll(markdownLinkRegex)) {
    const url = match[2];
    if (typeof url !== "string" || !url.trim()) {
      continue;
    }

    const baseIndex = match.index;
    const urlOffset = match[0].indexOf(url);
    candidates.push({
      url,
      index: baseIndex + Math.max(urlOffset, 0),
    });
  }

  const urlRegex = resetGlobalRegex(URL_REGEX);
  for (const match of text.matchAll(urlRegex)) {
    const url = match[0];
    if (typeof url === "string") {
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
    (match, label: string | undefined, url: string | undefined) => {
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
