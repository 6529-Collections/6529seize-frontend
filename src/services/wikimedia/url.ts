interface WikimediaLinkResult {
  readonly href: string;
}

const WIKIPEDIA_SUFFIX = ".wikipedia.org";
const WIKIMEDIA_SUFFIX = ".wikimedia.org";
const WIKIDATA_HOSTS = new Set(["wikidata.org", "www.wikidata.org"]);

const isWikimediaHost = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase();

  if (normalized === "w.wiki") {
    return true;
  }

  if (normalized.endsWith(WIKIPEDIA_SUFFIX)) {
    return true;
  }

  if (normalized.endsWith(WIKIMEDIA_SUFFIX)) {
    return true;
  }

  if (WIKIDATA_HOSTS.has(normalized)) {
    return true;
  }

  return false;
};

export const parseWikimediaLink = (href: string): WikimediaLinkResult | null => {
  try {
    const url = new URL(href);
    if (!isWikimediaHost(url.hostname)) {
      return null;
    }

    return { href };
  } catch {
    return null;
  }
};
