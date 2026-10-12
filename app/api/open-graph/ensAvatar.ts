import { publicEnv } from "@/config/env";
import { getEthereumMainnetClient } from "@/lib/ethereum/mainnetClient";
import { normalizeDecentralizedMediaUrl } from "@/lib/media/decentralized-media";
import { isAddress, parseAbi, type Address } from "viem";

import { PUBLIC_URL_OPTIONS } from "./publicUrlOptions";
import { fetchTokenUriJson } from "./tokenUriMetadata";

const NFT_AVATAR_ABI = parseAbi([
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function uri(uint256 id) view returns (string)",
]);
const NFT_AVATAR_RECORD = /^(?:did:nft:)?eip155:/i;
const JSON_DATA_URI_PREFIX = /^data:application\/json([^,]*),/i;
const TOKEN_ID_PLACEHOLDER = /(?:0x)?\{id\}/g;
const METADATA_IMAGE_KEYS = ["image", "image_url"] as const;

type NftAvatar = {
  readonly standard: "erc721" | "erc1155";
  readonly contract: Address;
  readonly tokenId: bigint;
};

/** Browser-loadable avatar URL; IPFS/Arweave refs use the 6529 media resolver. */
function toAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeDecentralizedMediaUrl(
    value,
    publicEnv.MEDIA_RESOLVER_ENDPOINT
  );
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/** Parses ENSIP-12 NFT avatar records (CAIP-22/29) for Ethereum mainnet. */
function parseNftAvatar(record: string): NftAvatar | null {
  // did:nft uses "_" separators; the eip155 erc721/erc1155 parts accepted
  // below never contain "_", so mapping every "_" to "/" is lossless.
  const caip = record.startsWith("did:nft:")
    ? record.slice("did:nft:".length).replaceAll("_", "/")
    : record;
  const [reference = "", asset = "", tokenId = ""] = caip.split("/");
  const [namespace, chainId] = reference.split(":");
  const [standard = "", contract = ""] = asset.split(":");
  const normalizedStandard = standard.toLowerCase();

  if (
    namespace?.toLowerCase() !== "eip155" ||
    chainId !== "1" ||
    (normalizedStandard !== "erc721" && normalizedStandard !== "erc1155") ||
    !isAddress(contract, { strict: false }) ||
    !tokenId
  ) {
    return null;
  }

  try {
    return {
      standard: normalizedStandard,
      contract,
      tokenId: BigInt(tokenId),
    };
  } catch {
    return null;
  }
}

function readNftMetadataUri(nft: NftAvatar): Promise<string> {
  return getEthereumMainnetClient().readContract({
    address: nft.contract,
    abi: NFT_AVATAR_ABI,
    functionName: nft.standard === "erc721" ? "tokenURI" : "uri",
    args: [nft.tokenId],
  });
}

function decodeJsonPayload(payload: string, params: string): string {
  if (/;base64/i.test(params)) {
    return Buffer.from(payload, "base64").toString("utf8");
  }
  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}

/** On-chain metadata is decoded in place; remote metadata uses the guarded fetcher. */
async function loadNftMetadata(
  nft: NftAvatar,
  metadataUri: string
): Promise<unknown> {
  const uri = metadataUri.trim();
  if (uri.startsWith("{")) {
    return JSON.parse(uri);
  }

  const dataUri = JSON_DATA_URI_PREFIX.exec(uri);
  const params = dataUri?.[1] ?? "";
  if (dataUri && (params === "" || params.startsWith(";"))) {
    return JSON.parse(decodeJsonPayload(uri.slice(dataUri[0].length), params));
  }

  const tokenIdText =
    nft.standard === "erc1155"
      ? nft.tokenId.toString(16).padStart(64, "0")
      : nft.tokenId.toString();
  // IPFS/Arweave metadata URIs are intentionally rewritten to the first-party
  // 6529 media resolver host, which is then fetched through the guarded fetcher
  // like any other remote metadata URL.
  const metadataUrl = toAvatarUrl(
    uri.replaceAll(TOKEN_ID_PLACEHOLDER, tokenIdText)
  );
  return metadataUrl
    ? fetchTokenUriJson(new URL(metadataUrl), PUBLIC_URL_OPTIONS)
    : null;
}

function getMetadataImage(metadata: unknown): string | null {
  if (typeof metadata !== "object" || metadata === null) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  for (const key of METADATA_IMAGE_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

async function resolveAvatarRecord(value: string): Promise<string | null> {
  const record = value.trim();
  if (!NFT_AVATAR_RECORD.test(record)) {
    return toAvatarUrl(record);
  }

  const nft = parseNftAvatar(record);
  if (!nft) {
    return null;
  }

  const metadata = await loadNftMetadata(nft, await readNftMetadataUri(nft));
  return toAvatarUrl(getMetadataImage(metadata));
}

/**
 * Resolves an ENS avatar record through the guarded public-URL fetcher instead
 * of viem's getEnsAvatar. Direct image URLs are returned for the viewer's
 * browser to load; only NFT metadata is fetched server-side.
 */
export async function fetchEnsAvatarUrl(name: string): Promise<string | null> {
  try {
    const record = await getEthereumMainnetClient().getEnsText({
      name,
      key: "avatar",
    });
    return record ? await resolveAvatarRecord(record) : null;
  } catch {
    return null;
  }
}
