const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/g;

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

/**
 * Returns a single URL to preview when the content is essentially just a URL
 * (e.g. `https://...` or `[title](https://...)`), otherwise returns null.
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

  const markdownLinkRegex = /\[[^\]]*]\(\s*(https?:\/\/[^\s)]+)\s*\)/g;
  const markdownLinkMatches = Array.from(trimmed.matchAll(markdownLinkRegex));
  const markdownLinkCandidates = markdownLinkMatches
    .map((match) => match[1])
    .filter(
      (candidate): candidate is string =>
        typeof candidate === "string" && candidate.trim().length > 0
    );

  const rawMatches = trimmed.match(URL_REGEX) ?? [];

  const allCandidates = [
    ...markdownLinkCandidates,
    ...rawMatches,
  ];

  const normalizedUrls = Array.from(
    new Set(
      allCandidates
        .map((candidate) => normalizeUrlCandidate(candidate))
        .filter((candidate): candidate is string => Boolean(candidate))
    )
  );

  if (normalizedUrls.length !== 1) {
    return null;
  }

  const onlyUrl = normalizedUrls[0]!;

  const withoutMarkdownLinks = trimmed.replace(markdownLinkRegex, "");
  const withoutUrls = withoutMarkdownLinks.replace(URL_REGEX, "");
  const remainingMeaningful = withoutUrls.replace(/[\s\W_]+/g, "");

  if (remainingMeaningful.length > 0) {
    return null;
  }

  return onlyUrl;
};
