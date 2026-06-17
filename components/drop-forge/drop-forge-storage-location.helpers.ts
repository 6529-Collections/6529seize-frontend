import { publicEnv } from "@/config/env";
import {
  DecentralizedMediaRef,
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";

type DropForgeStorageProvider = "arweave" | "ipfs";

interface DropForgeStorageLocationInfo {
  readonly rawValue: string;
  readonly displayValue: string;
  readonly displayTitle: string;
  readonly provider: DropForgeStorageProvider | null;
  readonly providerBadgeLabel: string | null;
  readonly openUrl: string | null;
  readonly copyValue: string | null;
}

const IPFS_CIDV0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const IPFS_CIDV1_PATTERN = /^b[a-z2-7]{20,}$/;
const ARWEAVE_TX_ID_PATTERN = /^[a-zA-Z0-9_-]{43,87}$/;

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);
const isBareIpfsCid = (value: string): boolean =>
  IPFS_CIDV0_PATTERN.test(value) || IPFS_CIDV1_PATTERN.test(value);
const isBareArweaveTxId = (value: string): boolean =>
  ARWEAVE_TX_ID_PATTERN.test(value);

const toRootIdentifier = (value: string): string => {
  const [identifier] = value.split("/");
  return identifier ?? value;
};

const buildLocationInfo = (
  rawValue: string,
  ref: DecentralizedMediaRef
): DropForgeStorageLocationInfo => {
  const displayValue = toRootIdentifier(ref.id);
  const openUrl = to6529ResolverUrl(ref, publicEnv.MEDIA_RESOLVER_ENDPOINT);

  return {
    rawValue,
    displayValue: displayValue || rawValue,
    displayTitle: rawValue,
    provider: ref.protocol === "arweave" ? "arweave" : "ipfs",
    providerBadgeLabel:
      ref.protocol === "arweave" ? null : ref.protocol.toUpperCase(),
    openUrl,
    copyValue: openUrl,
  };
};

const buildRawLocationInfo = (
  rawValue: string
): DropForgeStorageLocationInfo => ({
  rawValue,
  displayValue: rawValue,
  displayTitle: rawValue,
  provider: null,
  providerBadgeLabel: null,
  openUrl: null,
  copyValue: rawValue,
});

export function getDropForgeStorageLocationInfo(
  location: string | null | undefined
): DropForgeStorageLocationInfo | null {
  const trimmedValue = location?.trim() ?? "";

  if (!trimmedValue) {
    return null;
  }

  const parsed = parseDecentralizedMediaRef(trimmedValue);
  if (parsed) {
    return buildLocationInfo(trimmedValue, parsed);
  }

  // CIDv1 base32 strings also satisfy the broad Arweave tx-id shape below.
  // Keep the bare IPFS CID check first so bare CIDs stay IPFS locations.
  if (isBareIpfsCid(trimmedValue)) {
    return buildLocationInfo(trimmedValue, {
      protocol: "ipfs",
      id: trimmedValue,
      path: "",
    });
  }

  if (isBareArweaveTxId(trimmedValue)) {
    return buildLocationInfo(trimmedValue, {
      protocol: "arweave",
      id: trimmedValue,
      path: "",
    });
  }

  if (isHttpUrl(trimmedValue)) {
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

  return buildRawLocationInfo(trimmedValue);
}
