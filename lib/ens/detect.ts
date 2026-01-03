import { getAddress, isAddress } from "viem";

export type EnsTarget =
  | { readonly kind: "name"; readonly input: string }
  | { readonly kind: "address"; readonly input: string };

const ENS_NAME_PATTERN = /\.eth$/i;
const ENS_REVERSE_PATTERN = /\.addr\.reverse$/i;

const extractEnsNameFromUrl = (url: URL): string | null => {
  const hostname = url.hostname.toLowerCase();
  const segments = url.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (hostname === "app.ens.domains") {
    if (segments.length === 1) {
      return decodeURIComponent(segments[0]!);
    }
    if (segments.length >= 2) {
      if (segments[0] === "name" || segments[0] === "address") {
        return decodeURIComponent(segments[1]!);
      }
    }
  }

  if (hostname === "etherscan.io" && segments.length >= 2) {
    if (segments[0] === "address") {
      return decodeURIComponent(segments[1]!);
    }
  }

  return null;
};

const extractAddressCandidate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("0x") && isAddress(trimmed)) {
    return getAddress(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    const fromPath = extractEnsNameFromUrl(parsed);
    if (fromPath && fromPath.startsWith("0x") && isAddress(fromPath)) {
      return getAddress(fromPath);
    }
  } catch {
    // ignore parsing errors for non-URL inputs
  }

  return null;
};

const extractNameCandidate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const fromUrl = extractEnsNameFromUrl(parsed);
    if (
      fromUrl &&
      (ENS_NAME_PATTERN.test(fromUrl) || ENS_REVERSE_PATTERN.test(fromUrl))
    ) {
      return fromUrl;
    }
  } catch {
    // ignore parsing errors for non-URL inputs
  }

  if (ENS_NAME_PATTERN.test(trimmed) || ENS_REVERSE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return null;
};

export const detectEnsTarget = (
  raw: string | null | undefined
): EnsTarget | null => {
  if (!raw) {
    return null;
  }

  const address = extractAddressCandidate(raw);
  if (address) {
    return { kind: "address", input: address };
  }

  const name = extractNameCandidate(raw);
  if (name) {
    return { kind: "name", input: name };
  }

  return null;
};

export const isLikelyEnsTarget = (value: string | null | undefined): boolean => {
  return detectEnsTarget(value) !== null;
};
