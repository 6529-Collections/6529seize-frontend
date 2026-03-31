import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { stripArweaveGatewayUrlPrefix } from "@/lib/media/arweave-gateways";

type DropForgeStorageProvider = "arweave" | "ipfs";

interface DropForgeStorageLocationInfo {
  readonly rawValue: string;
  readonly displayValue: string;
  readonly displayTitle: string;
  readonly provider: DropForgeStorageProvider;
  readonly providerBadgeLabel: string | null;
  readonly openUrl: string | null;
  readonly copyValue: string | null;
}

const IPFS_PROTOCOL_PREFIX = "ipfs://";
const ARWEAVE_PROTOCOL_PREFIX = "ar://";
const IPFS_CIDV0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const IPFS_CIDV1_PATTERN = /^b[a-z2-7]{20,}$/;

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);
const isBareIpfsCid = (value: string): boolean =>
  IPFS_CIDV0_PATTERN.test(value) || IPFS_CIDV1_PATTERN.test(value);

const toRootIdentifier = (value: string): string => {
  const [identifier] = value.split("/");
  return identifier ?? value;
};

const normalizeIpfsPath = (value: string): string => {
  let normalized = value.trim();

  if (normalized.toLowerCase().startsWith(IPFS_PROTOCOL_PREFIX)) {
    normalized = normalized.slice(IPFS_PROTOCOL_PREFIX.length);
  }

  normalized = normalized.replace(/^ipfs\/+/i, "");
  normalized = normalized.replace(/^\/+/, "");

  return normalized;
};

const getIpfsPathFromUrl = (value: string): string | null => {
  try {
    const parsedUrl = new URL(value);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

    if (pathSegments[0]?.toLowerCase() !== "ipfs" || !pathSegments[1]) {
      return null;
    }

    return pathSegments.slice(1).join("/");
  } catch {
    return null;
  }
};

const buildIpfsLocationInfo = (
  rawValue: string,
  ipfsPath: string
): DropForgeStorageLocationInfo => {
  const normalizedPath = normalizeIpfsPath(ipfsPath);
  const displayValue = toRootIdentifier(normalizedPath);
  const openUrl = normalizedPath
    ? resolveIpfsUrlSync(`${IPFS_PROTOCOL_PREFIX}${normalizedPath}`)
    : null;

  return {
    rawValue,
    displayValue: displayValue || rawValue,
    displayTitle: rawValue,
    provider: "ipfs",
    providerBadgeLabel: "IPFS",
    openUrl,
    copyValue: openUrl,
  };
};

const buildArweaveLocationInfo = (
  rawValue: string,
  identifier: string
): DropForgeStorageLocationInfo => {
  const trimmedIdentifier = identifier.trim();
  const rootIdentifier = toRootIdentifier(trimmedIdentifier);
  const openUrl = rootIdentifier
    ? `https://arweave.net/${rootIdentifier}`
    : null;

  return {
    rawValue,
    displayValue: rootIdentifier || rawValue,
    displayTitle: rawValue,
    provider: "arweave",
    providerBadgeLabel: null,
    openUrl,
    copyValue: openUrl,
  };
};

export function getDropForgeStorageLocationInfo(
  location: string | null | undefined
): DropForgeStorageLocationInfo | null {
  const trimmedValue = location?.trim() ?? "";

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.toLowerCase().startsWith(IPFS_PROTOCOL_PREFIX)) {
    return buildIpfsLocationInfo(trimmedValue, trimmedValue);
  }

  if (trimmedValue.toLowerCase().startsWith(ARWEAVE_PROTOCOL_PREFIX)) {
    return buildArweaveLocationInfo(
      trimmedValue,
      trimmedValue.slice(ARWEAVE_PROTOCOL_PREFIX.length)
    );
  }

  const ipfsPath = getIpfsPathFromUrl(trimmedValue);
  if (ipfsPath) {
    return buildIpfsLocationInfo(trimmedValue, ipfsPath);
  }

  if (isHttpUrl(trimmedValue)) {
    const strippedArweavePath = stripArweaveGatewayUrlPrefix(trimmedValue);
    if (strippedArweavePath !== trimmedValue) {
      return buildArweaveLocationInfo(trimmedValue, strippedArweavePath);
    }

    return {
      rawValue: trimmedValue,
      displayValue: trimmedValue,
      displayTitle: trimmedValue,
      provider: "arweave",
      providerBadgeLabel: null,
      openUrl: trimmedValue,
      copyValue: trimmedValue,
    };
  }

  if (isBareIpfsCid(trimmedValue)) {
    return buildIpfsLocationInfo(trimmedValue, trimmedValue);
  }

  return buildArweaveLocationInfo(trimmedValue, trimmedValue);
}
