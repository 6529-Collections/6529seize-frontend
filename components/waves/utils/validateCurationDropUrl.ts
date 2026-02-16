import { matchesDomainOrSubdomain } from "@/lib/url/domains";

type CurationUrlValidationResult = {
  error: true;
  helperText: string;
} | null;

const URL_ONLY_HELPER_TEXT = "Enter URL only (no extra text).";
const INVALID_URL_HELPER_TEXT = "Enter a valid HTTPS URL.";
const ALLOWED_DOMAIN_HELPER_TEXT =
  "URL must be from superrare.com, manifold.xyz, opensea.io, transient.xyz, or foundation.app.";

const HAS_WHITESPACE_REGEX = /\s/;

const isSuperRareUrl = (url: URL): boolean => {
  return matchesDomainOrSubdomain(url.hostname, "superrare.com");
};

const isManifoldUrl = (url: URL): boolean => {
  return matchesDomainOrSubdomain(url.hostname, "manifold.xyz");
};

const isOpenSeaUrl = (url: URL): boolean => {
  return matchesDomainOrSubdomain(url.hostname, "opensea.io");
};

const isTransientUrl = (url: URL): boolean => {
  return matchesDomainOrSubdomain(url.hostname, "transient.xyz");
};

const isFoundationUrl = (url: URL): boolean => {
  return matchesDomainOrSubdomain(url.hostname, "foundation.app");
};

const isAllowedCurationDomainUrl = (url: URL): boolean => {
  if (isSuperRareUrl(url)) {
    return true;
  }

  if (isManifoldUrl(url)) {
    return true;
  }

  if (isOpenSeaUrl(url)) {
    return true;
  }

  if (isTransientUrl(url)) {
    return true;
  }

  if (isFoundationUrl(url)) {
    return true;
  }

  return false;
};

const parseHttpsUrl = (value: string): URL | null => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
};

export const validateCurationDropInput = (
  value: string
): CurationUrlValidationResult => {
  const trimmed = value.trim();
  if (!trimmed.length) {
    return {
      error: true,
      helperText: URL_ONLY_HELPER_TEXT,
    };
  }

  if (HAS_WHITESPACE_REGEX.test(trimmed)) {
    return {
      error: true,
      helperText: URL_ONLY_HELPER_TEXT,
    };
  }

  const parsedUrl = parseHttpsUrl(trimmed);
  if (!parsedUrl) {
    return {
      error: true,
      helperText: INVALID_URL_HELPER_TEXT,
    };
  }

  if (!isAllowedCurationDomainUrl(parsedUrl)) {
    return {
      error: true,
      helperText: ALLOWED_DOMAIN_HELPER_TEXT,
    };
  }

  return null;
};
