type CurationUrlValidationResult = {
  error: true;
  helperText: string;
} | null;

const URL_ONLY_HELPER_TEXT = "Enter URL only (no extra text).";
const INVALID_URL_HELPER_TEXT = "Enter a valid HTTPS URL.";
const ALLOWED_URL_HELPER_TEXT =
  "URL must match a supported curation link format.";

type SupportedCurationUrlExample = {
  readonly label: string;
  readonly example: string;
};

export const SUPPORTED_CURATION_URL_EXAMPLES: readonly SupportedCurationUrlExample[] =
  [
    {
      label: "SuperRare artwork",
      example: "https://superrare.com/artwork/eth/0x.../123",
    },
    {
      label: "Transient NFT",
      example: "https://transient.xyz/nfts/ethereum/0x.../123",
    },
    {
      label: "Transient mint",
      example: "https://transient.xyz/mint/your-drop-slug",
    },
    {
      label: "Manifold listing",
      example: "https://manifold.xyz/@creator/id/123",
    },
    {
      label: "Foundation mint",
      example: "https://foundation.app/mint/eth/0x.../123",
    },
    {
      label: "OpenSea item",
      example: "https://opensea.io/item/ethereum/0x.../123",
    },
    {
      label: "OpenSea asset",
      example: "https://opensea.io/assets/ethereum/0x.../123",
    },
  ];

const HAS_WHITESPACE_REGEX = /\s/;
const HAS_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

const CONTRACT_PART_REGEX = "0x[a-fA-F0-9]{40}";
const NUMERIC_ID_PART_REGEX = "[0-9]+";
const SLUG_ID_PART_REGEX = "[A-Za-z0-9][A-Za-z0-9._-]*";
const USER_PART_REGEX = "[A-Za-z0-9._-]+";

const ALLOWED_DOMAIN_PATH_PATTERNS: Readonly<
  Record<string, readonly RegExp[]>
> = {
  "superrare.com": [
    new RegExp(
      `^/artwork/eth/${CONTRACT_PART_REGEX}/${NUMERIC_ID_PART_REGEX}/?$`
    ),
  ],
  "transient.xyz": [
    new RegExp(
      `^/nfts/ethereum/${CONTRACT_PART_REGEX}/${NUMERIC_ID_PART_REGEX}/?$`
    ),
    new RegExp(`^/mint/${SLUG_ID_PART_REGEX}/?$`),
  ],
  "manifold.xyz": [
    new RegExp(`^/@${USER_PART_REGEX}/id/${NUMERIC_ID_PART_REGEX}/?$`),
  ],
  "foundation.app": [
    new RegExp(`^/mint/eth/${CONTRACT_PART_REGEX}/${NUMERIC_ID_PART_REGEX}/?$`),
  ],
  "opensea.io": [
    new RegExp(
      `^/item/ethereum/${CONTRACT_PART_REGEX}/${NUMERIC_ID_PART_REGEX}/?$`
    ),
    new RegExp(
      `^/assets/ethereum/${CONTRACT_PART_REGEX}/${NUMERIC_ID_PART_REGEX}/?$`
    ),
  ],
};

const normalizeHostname = (value: string): string =>
  value.trim().toLowerCase().replace(/\.+$/, "");

const parseCurationUrl = (value: string): URL | null => {
  const normalizedValue = HAS_SCHEME_REGEX.test(value)
    ? value
    : `https://${value}`;
  try {
    const url = new URL(normalizedValue);
    if (url.protocol !== "https:") {
      return null;
    }
    if (!url.hostname) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
};

const getAllowedDomain = (url: URL): string | null => {
  const hostname = normalizeHostname(url.hostname);
  if (ALLOWED_DOMAIN_PATH_PATTERNS[hostname]) {
    return hostname;
  }

  if (hostname.startsWith("www.")) {
    const domainWithoutWww = hostname.slice(4);
    if (ALLOWED_DOMAIN_PATH_PATTERNS[domainWithoutWww]) {
      return domainWithoutWww;
    }
  }

  return null;
};

const matchesAllowedPathPattern = (
  domain: string,
  pathname: string
): boolean => {
  const patterns = ALLOWED_DOMAIN_PATH_PATTERNS[domain];
  if (!patterns) {
    return false;
  }
  return patterns.some((pattern) => pattern.test(pathname));
};

const isAllowedCurationUrl = (url: URL): boolean => {
  if (url.username || url.password || url.port) {
    return false;
  }
  if (url.search.length || url.hash.length) {
    return false;
  }

  const allowedDomain = getAllowedDomain(url);
  if (!allowedDomain) {
    return false;
  }

  return matchesAllowedPathPattern(allowedDomain, url.pathname);
};

const toCanonicalHttpsUrl = (url: URL): string => {
  return `https://${normalizeHostname(url.hostname)}${url.pathname}`;
};

export const normalizeCurationDropInput = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed.length || HAS_WHITESPACE_REGEX.test(trimmed)) {
    return null;
  }

  const parsedUrl = parseCurationUrl(trimmed);
  if (!parsedUrl || !isAllowedCurationUrl(parsedUrl)) {
    return null;
  }

  return toCanonicalHttpsUrl(parsedUrl);
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

  const parsedUrl = parseCurationUrl(trimmed);
  if (!parsedUrl) {
    return {
      error: true,
      helperText: INVALID_URL_HELPER_TEXT,
    };
  }

  if (!isAllowedCurationUrl(parsedUrl)) {
    return {
      error: true,
      helperText: ALLOWED_URL_HELPER_TEXT,
    };
  }

  return null;
};
