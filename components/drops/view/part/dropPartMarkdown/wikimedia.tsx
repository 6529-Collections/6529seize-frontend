import type { ReactElement } from "react";

type WikimediaCardComponent = typeof import("@/components/waves/wikimedia/WikimediaCard").default;

const getWikimediaCard = (): WikimediaCardComponent => {
  const module = require("@/components/waves/wikimedia/WikimediaCard");
  return module.default as WikimediaCardComponent;
};

const SUPPORTED_SUFFIXES = [
  ".wikipedia.org",
  ".wiktionary.org",
  ".wikivoyage.org",
  ".wikisource.org",
  ".wikidata.org",
  ".wikimedia.org",
];

const SUPPORTED_HOSTS = new Set([
  "w.wiki",
  "wikidata.org",
  "www.wikidata.org",
  "commons.wikimedia.org",
  "upload.wikimedia.org",
]);

const normalizeHost = (host: string): string => host.replace(/^www\./i, "").toLowerCase();

export const isWikimediaHost = (host: string): boolean => {
  const normalized = normalizeHost(host);
  if (SUPPORTED_HOSTS.has(normalized)) {
    return true;
  }

  return SUPPORTED_SUFFIXES.some((suffix) =>
    normalized === suffix.slice(1) || normalized.endsWith(suffix)
  );
};

export const parseWikimediaLink = (href: string): { href: string } | null => {
  try {
    const url = new URL(href);
    if (!isWikimediaHost(url.hostname)) {
      return null;
    }

    const protocol = url.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return null;
    }

    return { href };
  } catch {
    return null;
  }
};

export const renderWikimediaLink = (
  result: { href: string },
  href: string
): ReactElement | null => {
  const WikimediaCard = getWikimediaCard();
  return <WikimediaCard href={href} />;
};
