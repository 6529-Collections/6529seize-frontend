export const TOKEN_URI_PREFIXED_PLACEHOLDER_PATTERN = /0x(?:\{id\}|%7Bid%7D)/i;

export const normalizeTokenIdCandidate = (tokenId: string): string => {
  const trimmed = tokenId.trim();
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    try {
      return `0x${BigInt(trimmed).toString(16)}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

export const toHexTokenId = (tokenId: string): string | null => {
  const trimmed = tokenId.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return `0x${BigInt(trimmed).toString(16)}`;
  } catch {
    return null;
  }
};

export const buildTokenIdCandidates = (tokenId: string): string[] => {
  const normalizedPrimary = normalizeTokenIdCandidate(tokenId);
  const candidates = [normalizedPrimary];
  const hexCandidate = toHexTokenId(tokenId);

  if (hexCandidate && !candidates.includes(hexCandidate)) {
    candidates.push(hexCandidate);
  }

  return candidates;
};

export const getTokenIdParts = (
  tokenId: string
): {
  readonly decimal: string;
  readonly hexNoPrefix: string;
  readonly hex64NoPrefix: string;
} | null => {
  try {
    const parsed = BigInt(tokenId.trim());
    const hexNoPrefix = parsed.toString(16);
    return {
      decimal: parsed.toString(10),
      hexNoPrefix,
      hex64NoPrefix: hexNoPrefix.padStart(64, "0"),
    };
  } catch {
    return null;
  }
};

export const hasTokenIdPlaceholder = (tokenUri: string): boolean =>
  /\{id\}/i.test(tokenUri) || /%7Bid%7D/i.test(tokenUri);

export const replaceTokenIdPlaceholders = (
  tokenUri: string,
  value: string
): string =>
  tokenUri.replaceAll(/\{id\}/gi, value).replaceAll(/%7Bid%7D/gi, value);
