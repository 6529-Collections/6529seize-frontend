import {
  formatEther,
  formatUnits,
  getAddress,
  isAddress,
  keccak256,
  parseAbi,
  stringToHex,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
} from "viem";

import type { PreviewPlan } from "@/app/api/open-graph/compound/service";
import { buildCompoundSummaryFromLogs } from "@/app/api/open-graph/compound/service";
import {
  isEtherscanEntityTarget,
  parseEtherscanUrl,
} from "@/lib/link-preview/etherscan/parse";
import type {
  EtherscanAddressView,
  EtherscanBlockView,
  EtherscanNftView,
  EtherscanPageView,
  EtherscanPreview,
  EtherscanPreviewBase,
  EtherscanTarget,
  EtherscanTokenView,
  EtherscanTransactionView,
} from "@/lib/link-preview/etherscan/types";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

import { getEtherscanPublicClient } from "./networkRegistry";

const ROUTE_ONLY_TTL_MS = 24 * 60 * 60 * 1000;
const IMMUTABLE_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_TTL_MS = 10 * 1000;
const RECENT_TTL_MS = 30 * 1000;
const ADDRESS_TTL_MS = 45 * 1000;
const TOKEN_TTL_MS = 5 * 60 * 1000;
const TOTAL_BUDGET_MS = 6000;
const EMPTY_HEX = "0x";
const TRANSFER_TOPIC = keccak256(
  stringToHex("Transfer(address,address,uint256)")
);
const ERC721_INTERFACE_ID = "0x80ac58cd" as const;
const ERC1155_INTERFACE_ID = "0xd9b67a26" as const;

const TOKEN_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function ownerOf(uint256 tokenId) view returns (address)",
]);

function nowIso(): string {
  return new Date().toISOString();
}

function getCacheMetadata(ttlMs: number) {
  return {
    maxAgeSeconds: Math.max(1, Math.floor(ttlMs / 1000)),
    staleWhileRevalidateSeconds: Math.max(5, Math.floor(ttlMs / 1000)),
    immutable: ttlMs >= IMMUTABLE_TTL_MS ? true : undefined,
  };
}

function createBase(
  target: EtherscanTarget,
  options: {
    readonly completeness: EtherscanPreviewBase["completeness"];
    readonly ttlMs: number;
    readonly blockNumber?: string | undefined;
    readonly hasRpc?: boolean | undefined;
  }
): EtherscanPreviewBase {
  return {
    provider: "etherscan",
    requestUrl: target.requestUrl,
    canonicalUrl: target.canonicalUrl,
    network: target.network,
    routeFamily: target.routeFamily,
    contexts: target.contexts,
    provenance: options.hasRpc
      ? [
          {
            source: "rpc",
            asOf: nowIso(),
            blockNumber: options.blockNumber,
            confidence: "authoritative",
          },
        ]
      : [],
    completeness: options.completeness,
    stale: false,
    cache: getCacheMetadata(options.ttlMs),
  };
}

function createPagePreview(target: EtherscanTarget): EtherscanPreview {
  const fallbackPage: EtherscanPageView = {
    titleKey: "linkPreview.etherscan.page.generic",
    descriptionKey: "linkPreview.etherscan.description.unknown",
  };
  const type = `etherscan.${target.kind}` as
    | "etherscan.list"
    | "etherscan.analytics"
    | "etherscan.tool"
    | "etherscan.page";
  return {
    ...createBase(target, {
      completeness: "route-only",
      ttlMs: ROUTE_ONLY_TTL_MS,
    }),
    type,
    page: target.page ?? fallbackPage,
  };
}

function createEntityFallback(target: EtherscanTarget): EtherscanPreview {
  const base = createBase(target, {
    completeness: target.network.status === "legacy" ? "route-only" : "partial",
    ttlMs:
      target.network.status === "legacy" ? ROUTE_ONLY_TTL_MS : RECENT_TTL_MS,
  });
  const identifier = target.identifier ?? "";

  switch (target.kind) {
    case "transaction":
      return {
        ...base,
        type: "etherscan.transaction",
        transaction: {
          hash: identifier,
          status: "unknown",
          action: "ethereum-transaction",
        },
      };
    case "address":
      return {
        ...base,
        type: "etherscan.address",
        address: {
          input: identifier,
          address: isAddress(identifier) ? getAddress(identifier) : undefined,
          subtype: "unknown",
        },
      };
    case "token":
      return {
        ...base,
        type: "etherscan.token",
        token: {
          address: identifier,
          standard: "unknown",
        },
      };
    case "nft":
      return {
        ...base,
        type: "etherscan.nft",
        nft: {
          contract: identifier,
          tokenId: target.secondaryIdentifier ?? "",
          standard: "unknown",
        },
      };
    case "block":
      return {
        ...base,
        type: "etherscan.block",
        block: {
          identifier,
          status: "unknown",
        },
      };
    case "uncle":
      return {
        ...base,
        type: "etherscan.uncle",
        uncle: { identifier },
      };
    case "blob":
      return {
        ...base,
        type: "etherscan.blob",
        blob: {
          identifier,
          index: target.secondaryIdentifier,
        },
      };
    case "signature":
      return {
        ...base,
        type: "etherscan.signature",
        signature: { identifier },
      };
    case "list":
    case "analytics":
    case "tool":
    case "page":
      return createPagePreview(target);
  }
}

async function settledValue<T>(operation: Promise<T>): Promise<T | undefined> {
  try {
    return await operation;
  } catch {
    return undefined;
  }
}

function getTransactionAction(options: {
  readonly value: bigint;
  readonly input: `0x${string}`;
  readonly to: Address | null;
  readonly contractAddress?: Address | null | undefined;
  readonly logs?: readonly {
    readonly topics: readonly Hash[];
  }[];
}): EtherscanTransactionView["action"] {
  if (options.to === null || options.contractAddress) {
    return "contract-creation";
  }
  if (
    options.logs?.some(
      (log) => log.topics[0]?.toLowerCase() === TRANSFER_TOPIC.toLowerCase()
    )
  ) {
    return "token-transfer";
  }
  if (options.value > 0n && options.input === EMPTY_HEX) {
    return "native-transfer";
  }
  if (options.input.length >= 10) {
    return "contract-interaction";
  }
  return "ethereum-transaction";
}

function getConfirmations(
  blockNumber: bigint,
  latest: bigint | undefined
): bigint | undefined {
  return latest !== undefined && latest >= blockNumber
    ? latest - blockNumber + 1n
    : undefined;
}

function getFinalized(
  blockNumber: bigint,
  finalizedBlockNumber: bigint | undefined
): boolean | undefined {
  return finalizedBlockNumber === undefined
    ? undefined
    : blockNumber <= finalizedBlockNumber;
}

function getTimestamp(timestamp: bigint | undefined): string | undefined {
  if (timestamp === undefined || timestamp > BigInt(Number.MAX_SAFE_INTEGER)) {
    return undefined;
  }
  return new Date(Number(timestamp) * 1000).toISOString();
}

function getTransactionTtl(
  status: EtherscanTransactionView["status"],
  finalized: boolean | undefined
): number {
  if (status === "pending") {
    return PENDING_TTL_MS;
  }
  return finalized === true ? IMMUTABLE_TTL_MS : RECENT_TTL_MS;
}

function getProtocolAction(
  chainId: number,
  receipt:
    | {
        readonly logs: readonly {
          readonly address: Address;
          readonly data: Hex;
          readonly topics: readonly Hash[];
        }[];
      }
    | undefined,
  from: Address,
  to: Address | null
): EtherscanTransactionView["protocolAction"] {
  if (chainId !== 1 || receipt === undefined) {
    return undefined;
  }
  const summary = buildCompoundSummaryFromLogs(receipt.logs, {
    from,
    ...(to ? { to } : {}),
  });
  return summary
    ? {
        protocol: "Compound",
        version: summary.version,
        action: summary.action,
        amount: summary.amount,
        token: summary.token,
        market: summary.market.symbol,
      }
    : undefined;
}

async function fetchTransactionPreview(
  target: EtherscanTarget,
  client: PublicClient
): Promise<{ readonly data: EtherscanPreview; readonly ttl: number }> {
  const hash = target.identifier as Hash;
  const transaction = await client.getTransaction({ hash });
  const receipt = await settledValue(client.getTransactionReceipt({ hash }));
  const blockNumber = receipt?.blockNumber ?? transaction.blockNumber;
  const [block, latest, finalizedBlock] = await Promise.all([
    settledValue(client.getBlock({ blockNumber })),
    settledValue(client.getBlockNumber()),
    settledValue(client.getBlock({ blockTag: "finalized" })),
  ]);
  const status = receipt?.status ?? "pending";
  const confirmations = getConfirmations(blockNumber, latest);
  const finalized = getFinalized(blockNumber, finalizedBlock?.number);
  const fee = receipt ? receipt.gasUsed * receipt.effectiveGasPrice : undefined;
  const ttl = getTransactionTtl(status, finalized);

  const transactionView: EtherscanTransactionView = {
    hash,
    status,
    action: getTransactionAction({
      value: transaction.value,
      input: transaction.input,
      to: transaction.to,
      contractAddress: receipt?.contractAddress,
      ...(receipt ? { logs: receipt.logs } : {}),
    }),
    from: getAddress(transaction.from),
    to: transaction.to ? getAddress(transaction.to) : undefined,
    createdContract: receipt?.contractAddress
      ? getAddress(receipt.contractAddress)
      : undefined,
    valueEth:
      transaction.value > 0n ? formatEther(transaction.value) : undefined,
    timestamp: getTimestamp(block?.timestamp),
    blockNumber: blockNumber.toString(),
    confirmations: confirmations?.toString(),
    finalized,
    feeEth: fee === undefined ? undefined : formatEther(fee),
    methodId:
      transaction.input.length >= 10
        ? transaction.input.slice(0, 10)
        : undefined,
    protocolAction: getProtocolAction(
      target.network.chainId,
      receipt,
      getAddress(transaction.from),
      transaction.to ? getAddress(transaction.to) : null
    ),
  };

  return {
    data: {
      ...createBase(target, {
        completeness:
          block !== undefined && receipt !== undefined ? "complete" : "partial",
        ttlMs: ttl,
        blockNumber: blockNumber.toString(),
        hasRpc: true,
      }),
      type: "etherscan.transaction",
      transaction: transactionView,
    },
    ttl,
  };
}

function sanitizeOnchainText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value
    .replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.slice(0, 80) : undefined;
}

function getAddressSubtype(
  code: `0x${string}` | undefined,
  delegationTarget: Address | undefined
): EtherscanAddressView["subtype"] {
  if (delegationTarget) {
    return "delegated-eoa";
  }
  if (code === undefined) {
    return "unknown";
  }
  return code === EMPTY_HEX ? "eoa" : "contract";
}

async function resolveAddressInput(
  target: EtherscanTarget,
  client: PublicClient
): Promise<Address | null> {
  const input = target.identifier ?? "";
  if (isAddress(input)) {
    return getAddress(input);
  }
  if (!input.endsWith(".eth") || target.network.key === "hoodi") {
    return null;
  }
  try {
    return (
      (await client.getEnsAddress({
        name: input,
      })) ?? null
    );
  } catch {
    return null;
  }
}

async function fetchAddressPreview(
  target: EtherscanTarget,
  client: PublicClient
): Promise<{ readonly data: EtherscanPreview; readonly ttl: number }> {
  const address = await resolveAddressInput(target, client);
  if (!address) {
    return { data: createEntityFallback(target), ttl: ADDRESS_TTL_MS };
  }

  const [balance, code, blockNumber] = await Promise.all([
    settledValue(client.getBalance({ address })),
    settledValue(client.getCode({ address })),
    settledValue(client.getBlockNumber()),
  ]);
  const delegationTarget =
    code?.toLowerCase().startsWith("0xef0100") && code.length >= 48
      ? getAddress(`0x${code.slice(8, 48)}`)
      : undefined;
  const view: EtherscanAddressView = {
    input: target.identifier ?? address,
    address,
    subtype: getAddressSubtype(code, delegationTarget),
    balanceEth: balance === undefined ? undefined : formatEther(balance),
    blockNumber: blockNumber?.toString(),
    delegationTarget,
  };
  const complete =
    balance !== undefined && code !== undefined && blockNumber !== undefined;

  return {
    data: {
      ...createBase(target, {
        completeness: complete ? "complete" : "partial",
        ttlMs: ADDRESS_TTL_MS,
        blockNumber: blockNumber?.toString(),
        hasRpc: true,
      }),
      type: "etherscan.address",
      address: view,
    },
    ttl: ADDRESS_TTL_MS,
  };
}

async function readTokenField<T>(
  client: PublicClient,
  address: Address,
  functionName: "name" | "symbol" | "decimals" | "totalSupply"
): Promise<T | undefined> {
  try {
    return (await client.readContract({
      address,
      abi: TOKEN_ABI,
      functionName,
    })) as T;
  } catch {
    return undefined;
  }
}

async function supportsInterface(
  client: PublicClient,
  address: Address,
  interfaceId: typeof ERC721_INTERFACE_ID | typeof ERC1155_INTERFACE_ID
): Promise<boolean> {
  try {
    return Boolean(
      await client.readContract({
        address,
        abi: TOKEN_ABI,
        functionName: "supportsInterface",
        args: [interfaceId],
      })
    );
  } catch {
    return false;
  }
}

function getTokenStandard(
  erc721: boolean,
  erc1155: boolean,
  decimals: number | undefined
): EtherscanTokenView["standard"] {
  if (erc1155) {
    return "erc1155";
  }
  if (erc721) {
    return "erc721";
  }
  return decimals === undefined ? "unknown" : "erc20";
}

function getValidDecimals(value: unknown): number | undefined {
  return typeof value === "number" && value >= 0 && value <= 255
    ? value
    : undefined;
}

function formatTokenSupply(
  totalSupply: bigint | undefined,
  decimals: number | undefined
): string | undefined {
  if (totalSupply === undefined) {
    return undefined;
  }
  return decimals === undefined
    ? totalSupply.toString()
    : formatUnits(totalSupply, decimals);
}

async function getTokenIdentity(
  client: PublicClient,
  address: Address
): Promise<EtherscanTokenView> {
  const [name, symbol, decimals, totalSupply, erc721, erc1155] =
    await Promise.all([
      readTokenField<string>(client, address, "name"),
      readTokenField<string>(client, address, "symbol"),
      readTokenField<number>(client, address, "decimals"),
      readTokenField<bigint>(client, address, "totalSupply"),
      supportsInterface(client, address, ERC721_INTERFACE_ID),
      supportsInterface(client, address, ERC1155_INTERFACE_ID),
    ]);

  const validDecimals = getValidDecimals(decimals);
  return {
    address,
    standard: getTokenStandard(erc721, erc1155, validDecimals),
    name: sanitizeOnchainText(name),
    symbol: sanitizeOnchainText(symbol),
    decimals: validDecimals,
    totalSupply: formatTokenSupply(totalSupply, validDecimals),
  };
}

async function fetchTokenPreview(
  target: EtherscanTarget,
  client: PublicClient
): Promise<{ readonly data: EtherscanPreview; readonly ttl: number }> {
  const address = getAddress(target.identifier as Address);
  const token = await getTokenIdentity(client, address);
  return {
    data: {
      ...createBase(target, {
        completeness: token.standard === "unknown" ? "partial" : "complete",
        ttlMs: TOKEN_TTL_MS,
        hasRpc: true,
      }),
      type: "etherscan.token",
      token,
    },
    ttl: TOKEN_TTL_MS,
  };
}

async function fetchNftPreview(
  target: EtherscanTarget,
  client: PublicClient
): Promise<{ readonly data: EtherscanPreview; readonly ttl: number }> {
  const contract = getAddress(target.identifier as Address);
  const tokenId = target.secondaryIdentifier ?? "0";
  const tokenIdentity = await getTokenIdentity(client, contract);
  let owner: Address | undefined;
  if (tokenIdentity.standard === "erc721") {
    try {
      owner = await client.readContract({
        address: contract,
        abi: TOKEN_ABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });
    } catch {
      owner = undefined;
    }
  }
  const nft: EtherscanNftView = {
    contract,
    tokenId,
    standard:
      tokenIdentity.standard === "erc721" ||
      tokenIdentity.standard === "erc1155"
        ? tokenIdentity.standard
        : "unknown",
    collectionName: tokenIdentity.name,
    owner,
  };
  return {
    data: {
      ...createBase(target, {
        completeness: nft.standard === "unknown" ? "partial" : "complete",
        ttlMs: TOKEN_TTL_MS,
        hasRpc: true,
      }),
      type: "etherscan.nft",
      nft,
    },
    ttl: TOKEN_TTL_MS,
  };
}

async function fetchBlockPreview(
  target: EtherscanTarget,
  client: PublicClient
): Promise<{ readonly data: EtherscanPreview; readonly ttl: number }> {
  const identifier = target.identifier ?? "";
  const numeric = /^\d+$/.test(identifier) ? BigInt(identifier) : null;
  const [latest, finalized] = await Promise.all([
    settledValue(client.getBlockNumber()),
    settledValue(client.getBlock({ blockTag: "finalized" })),
  ]);

  if (numeric !== null && latest !== undefined && numeric > latest) {
    const block: EtherscanBlockView = {
      identifier,
      number: identifier,
      status: "future",
      currentHeight: latest.toString(),
      blocksRemaining: (numeric - latest).toString(),
    };
    return {
      data: {
        ...createBase(target, {
          completeness: "complete",
          ttlMs: RECENT_TTL_MS,
          blockNumber: latest.toString(),
          hasRpc: true,
        }),
        type: "etherscan.block",
        block,
      },
      ttl: RECENT_TTL_MS,
    };
  }

  const chainBlock =
    numeric === null
      ? await client.getBlock({ blockHash: identifier as Hash })
      : await client.getBlock({ blockNumber: numeric });
  const isFinalized =
    finalized !== undefined && chainBlock.number <= finalized.number;
  const ttl = isFinalized ? IMMUTABLE_TTL_MS : RECENT_TTL_MS;
  const block: EtherscanBlockView = {
    identifier,
    number: chainBlock.number.toString(),
    hash: chainBlock.hash,
    status: isFinalized ? "finalized" : "proposed",
    timestamp: new Date(Number(chainBlock.timestamp) * 1000).toISOString(),
    transactionCount: chainBlock.transactions.length,
    gasUsed: chainBlock.gasUsed.toString(),
    gasLimit: chainBlock.gasLimit.toString(),
    feeRecipient: chainBlock.miner,
    blobGasUsed: chainBlock.blobGasUsed.toString(),
    currentHeight: latest?.toString(),
  };
  return {
    data: {
      ...createBase(target, {
        completeness: "complete",
        ttlMs: ttl,
        blockNumber: chainBlock.number.toString(),
        hasRpc: true,
      }),
      type: "etherscan.block",
      block,
    },
    ttl,
  };
}

async function executeStructuredTarget(
  target: EtherscanTarget,
  client: PublicClient
): Promise<{ readonly data: EtherscanPreview; readonly ttl: number }> {
  switch (target.kind) {
    case "transaction":
      return fetchTransactionPreview(target, client);
    case "address":
      return fetchAddressPreview(target, client);
    case "token":
      return fetchTokenPreview(target, client);
    case "nft":
      return fetchNftPreview(target, client);
    case "block":
      return fetchBlockPreview(target, client);
    case "uncle":
    case "blob":
    case "signature":
      return { data: createEntityFallback(target), ttl: IMMUTABLE_TTL_MS };
    case "list":
    case "analytics":
    case "tool":
    case "page":
      return { data: createPagePreview(target), ttl: ROUTE_ONLY_TTL_MS };
  }
}

async function withinTotalBudget<T>(operation: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(
      () => reject(new Error("Etherscan structured preview timed out")),
      TOTAL_BUDGET_MS
    );
  });
  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

export function createEtherscanPlan(url: URL): PreviewPlan | null {
  const target = parseEtherscanUrl(url);
  if (!target) {
    return null;
  }

  if (!isEtherscanEntityTarget(target)) {
    return {
      cacheKey: target.cacheKey,
      execute: () =>
        Promise.resolve({
          data: createPagePreview(target) as LinkPreviewResponse,
          ttl: ROUTE_ONLY_TTL_MS,
        }),
    };
  }

  const client = getEtherscanPublicClient(target.network);
  if (!client) {
    return {
      cacheKey: target.cacheKey,
      execute: () =>
        Promise.resolve({
          data: createEntityFallback(target) as LinkPreviewResponse,
          ttl: ROUTE_ONLY_TTL_MS,
        }),
    };
  }

  return {
    cacheKey: target.cacheKey,
    execute: async () => {
      try {
        const result = await withinTotalBudget(
          executeStructuredTarget(target, client)
        );
        return {
          data: result.data as LinkPreviewResponse,
          ttl: result.ttl,
        };
      } catch {
        return {
          data: createEntityFallback(target) as LinkPreviewResponse,
          ttl: RECENT_TTL_MS,
        };
      }
    },
  };
}
