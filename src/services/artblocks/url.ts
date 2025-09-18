export interface ArtBlocksTokenIdentifier {
  readonly tokenId: string;
  readonly contract?: string;
}

const HEX_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const TOKEN_ID_REGEX = /^\d+$/;

const normalizeHost = (host: string): string => host.replace(/^www\./i, "").toLowerCase();

const ensureValidTokenId = (tokenId: string | undefined): string | null => {
  if (!tokenId) {
    return null;
  }

  const trimmed = tokenId.trim();
  return TOKEN_ID_REGEX.test(trimmed) ? trimmed : null;
};

const ensureValidContract = (contract: string | undefined): string | undefined => {
  if (!contract) {
    return undefined;
  }

  const trimmed = contract.trim();
  if (!HEX_ADDRESS_REGEX.test(trimmed)) {
    return undefined;
  }

  return trimmed.toLowerCase();
};

const parseFromArtBlocksApp = (
  segments: readonly string[]
): ArtBlocksTokenIdentifier | null => {
  if (segments[0] !== "token") {
    return null;
  }

  if (segments.length === 2) {
    const tokenId = ensureValidTokenId(segments[1]);
    return tokenId ? { tokenId } : null;
  }

  if (segments.length >= 3) {
    const contract = ensureValidContract(segments[1]);
    const tokenId = ensureValidTokenId(segments[2]);
    if (contract && tokenId) {
      return { contract, tokenId };
    }
  }

  return null;
};

const parseFromLive = (
  segments: readonly string[]
): ArtBlocksTokenIdentifier | null => {
  if (segments[0] !== "token") {
    return null;
  }

  const tokenId = ensureValidTokenId(segments[1]);
  return tokenId ? { tokenId } : null;
};

const stripExtension = (value: string): string => value.replace(/\.[^.]+$/, "");

const parseFromMedia = (
  segments: readonly string[]
): ArtBlocksTokenIdentifier | null => {
  if (segments.length < 1) {
    return null;
  }

  const tokenId = ensureValidTokenId(stripExtension(segments[0]));
  return tokenId ? { tokenId } : null;
};

const parseFromMediaProxy = (
  segments: readonly string[]
): ArtBlocksTokenIdentifier | null => {
  if (segments.length < 2) {
    return null;
  }

  const contract = ensureValidContract(segments[0]);
  const tokenId = ensureValidTokenId(stripExtension(segments[1]));

  if (contract && tokenId) {
    return { contract, tokenId };
  }

  return null;
};

const parseFromTokenApi = (
  segments: readonly string[]
): ArtBlocksTokenIdentifier | null => {
  if (segments.length === 1) {
    const tokenId = ensureValidTokenId(segments[0]);
    return tokenId ? { tokenId } : null;
  }

  if (segments.length >= 2) {
    const contract = ensureValidContract(segments[0]);
    const tokenId = ensureValidTokenId(segments[1]);
    if (contract && tokenId) {
      return { contract, tokenId };
    }
  }

  return null;
};

export const parseArtBlocksLink = (
  href: string
): ArtBlocksTokenIdentifier | null => {
  try {
    const url = new URL(href);
    const host = normalizeHost(url.hostname);
    const segments = url.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    switch (host) {
      case "artblocks.io":
        return parseFromArtBlocksApp(segments);
      case "live.artblocks.io":
        return parseFromLive(segments);
      case "media.artblocks.io":
        return parseFromMedia(segments);
      case "media-proxy.artblocks.io":
        return parseFromMediaProxy(segments);
      case "token.artblocks.io":
        return parseFromTokenApi(segments);
      default:
        return null;
    }
  } catch {
    return null;
  }
};

export const buildMediaUrl = ({
  contract,
  tokenId,
}: ArtBlocksTokenIdentifier): string => {
  if (contract) {
    return `https://media-proxy.artblocks.io/${contract}/${tokenId}.png`;
  }

  return `https://media.artblocks.io/${tokenId}.png`;
};

const FLAGSHIP_LIVE_SLUG = "flagship";

export const buildLiveUrl = ({
  contract,
  tokenId,
}: ArtBlocksTokenIdentifier): string => {
  const normalizedContract = ensureValidContract(contract);

  const prefix = normalizedContract ?? FLAGSHIP_LIVE_SLUG;
  return `https://live.artblocks.io/token/${prefix}-${tokenId}`;
};

export const buildTokenApiUrl = ({
  contract,
  tokenId,
}: ArtBlocksTokenIdentifier): string[] => {
  const endpoints: string[] = [];

  if (contract) {
    endpoints.push(`https://token.artblocks.io/${contract}/${tokenId}`);
  } else {
    endpoints.push(`https://token.artblocks.io/${tokenId}`);
  }

  return endpoints;
};

export type { ArtBlocksTokenIdentifier as ArtBlocksTokenId };
