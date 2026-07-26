import type { MessageKey } from "@/i18n/messages";

export type EtherscanNetwork =
  | {
      readonly chainId: 1;
      readonly key: "ethereum";
      readonly label: "Ethereum";
      readonly status: "current";
    }
  | {
      readonly chainId: 11155111;
      readonly key: "sepolia";
      readonly label: "Sepolia";
      readonly status: "current";
    }
  | {
      readonly chainId: 560048;
      readonly key: "hoodi";
      readonly label: "Hoodi";
      readonly status: "current";
    }
  | {
      readonly chainId: 3;
      readonly key: "ropsten";
      readonly label: "Ropsten";
      readonly status: "legacy";
    }
  | {
      readonly chainId: 4;
      readonly key: "rinkeby";
      readonly label: "Rinkeby";
      readonly status: "legacy";
    }
  | {
      readonly chainId: 5;
      readonly key: "goerli";
      readonly label: "Goerli";
      readonly status: "legacy";
    }
  | {
      readonly chainId: 42;
      readonly key: "kovan";
      readonly label: "Kovan";
      readonly status: "legacy";
    }
  | {
      readonly chainId: 17000;
      readonly key: "holesky";
      readonly label: "Holesky";
      readonly status: "legacy";
    };

export type EtherscanEntityKind =
  | "transaction"
  | "address"
  | "token"
  | "nft"
  | "block"
  | "uncle"
  | "blob"
  | "signature";

export type EtherscanRouteOnlyKind = "list" | "analytics" | "tool" | "page";
export type EtherscanTargetKind = EtherscanEntityKind | EtherscanRouteOnlyKind;

export interface EtherscanContext {
  readonly kind:
    | "tab"
    | "filter"
    | "trace"
    | "decoder"
    | "raw"
    | "countdown"
    | "tool";
  readonly labelKey: MessageKey;
}

export interface EtherscanPageTarget {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
}

export interface EtherscanTarget {
  readonly provider: "etherscan";
  readonly requestUrl: string;
  readonly canonicalUrl: string;
  readonly network: EtherscanNetwork;
  readonly routeFamily: string;
  readonly kind: EtherscanTargetKind;
  readonly identifier?: string | undefined;
  readonly secondaryIdentifier?: string | undefined;
  readonly contexts: readonly EtherscanContext[];
  readonly cacheKey: string;
  readonly page?: EtherscanPageTarget | undefined;
}

export type EtherscanDataSource =
  | "rpc"
  | "etherscan-api"
  | "ens"
  | "6529-api"
  | "token-metadata";

export interface EtherscanProvenance {
  readonly source: EtherscanDataSource;
  readonly asOf: string;
  readonly blockNumber?: string | undefined;
  readonly confidence: "authoritative" | "derived" | "attributed";
}

export interface EtherscanCacheMetadata {
  readonly maxAgeSeconds: number;
  readonly staleWhileRevalidateSeconds?: number | undefined;
  readonly immutable?: boolean | undefined;
}

interface EtherscanCompatibleMedia {
  readonly url?: string | null;
  readonly secureUrl?: string | null;
  readonly type?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly alt?: string | null;
  readonly [key: string]: unknown;
}

export interface EtherscanPreviewBase {
  readonly provider: "etherscan";
  readonly requestUrl: string;
  readonly canonicalUrl: string;
  readonly network: EtherscanNetwork;
  readonly routeFamily: string;
  readonly contexts: readonly EtherscanContext[];
  readonly provenance: readonly EtherscanProvenance[];
  readonly completeness: "complete" | "partial" | "route-only";
  readonly stale: boolean;
  readonly cache: EtherscanCacheMetadata;
  readonly url?: string | null;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly siteName?: string | null;
  readonly mediaType?: string | null;
  readonly contentType?: string | null;
  readonly favicon?: string | null;
  readonly favicons?: readonly string[] | null;
  readonly image?: EtherscanCompatibleMedia | null;
  readonly images?: readonly EtherscanCompatibleMedia[] | null;
  readonly source?: string | null;
  readonly author?: string | null;
  readonly publishedTime?: string | null;
  readonly modifiedTime?: string | null;
  readonly section?: string | null;
  readonly [key: string]: unknown;
}

export type EtherscanTransactionStatus =
  | "pending"
  | "success"
  | "reverted"
  | "unknown";

export interface EtherscanProtocolAction {
  readonly protocol: "Compound";
  readonly version: "v2" | "v3";
  readonly action:
    | "supply"
    | "redeem"
    | "borrow"
    | "repay"
    | "liquidate"
    | "withdraw";
  readonly amount: string;
  readonly token: string;
  readonly market: string;
}

export interface EtherscanTransactionView {
  readonly hash: string;
  readonly status: EtherscanTransactionStatus;
  readonly action:
    | "native-transfer"
    | "token-transfer"
    | "contract-creation"
    | "contract-interaction"
    | "ethereum-transaction";
  readonly from?: string | undefined;
  readonly to?: string | undefined;
  readonly createdContract?: string | undefined;
  readonly valueEth?: string | undefined;
  readonly timestamp?: string | undefined;
  readonly blockNumber?: string | undefined;
  readonly confirmations?: string | undefined;
  readonly finalized?: boolean | undefined;
  readonly feeEth?: string | undefined;
  readonly methodId?: string | undefined;
  readonly protocolAction?: EtherscanProtocolAction | undefined;
}

export interface EtherscanAddressView {
  readonly input: string;
  readonly address?: string | undefined;
  readonly subtype: "eoa" | "contract" | "delegated-eoa" | "unknown";
  readonly balanceEth?: string | undefined;
  readonly blockNumber?: string | undefined;
  readonly delegationTarget?: string | undefined;
}

export interface EtherscanTokenView {
  readonly address: string;
  readonly standard: "erc20" | "erc721" | "erc1155" | "unknown";
  readonly name?: string | undefined;
  readonly symbol?: string | undefined;
  readonly decimals?: number | undefined;
  readonly totalSupply?: string | undefined;
}

export interface EtherscanNftView {
  readonly contract: string;
  readonly tokenId: string;
  readonly standard: "erc721" | "erc1155" | "unknown";
  readonly collectionName?: string | undefined;
  readonly owner?: string | undefined;
}

export interface EtherscanBlockView {
  readonly identifier: string;
  readonly number?: string | undefined;
  readonly hash?: string | undefined;
  readonly status: "proposed" | "finalized" | "future" | "unknown";
  readonly timestamp?: string | undefined;
  readonly transactionCount?: number | undefined;
  readonly gasUsed?: string | undefined;
  readonly gasLimit?: string | undefined;
  readonly feeRecipient?: string | undefined;
  readonly blobGasUsed?: string | undefined;
  readonly currentHeight?: string | undefined;
  readonly blocksRemaining?: string | undefined;
}

export interface EtherscanSpecialEntityView {
  readonly identifier: string;
  readonly index?: string | undefined;
}

export interface EtherscanPageView {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
}

export type EtherscanPreview =
  | (EtherscanPreviewBase & {
      readonly type: "etherscan.transaction";
      readonly transaction: EtherscanTransactionView;
    })
  | (EtherscanPreviewBase & {
      readonly type: "etherscan.address";
      readonly address: EtherscanAddressView;
    })
  | (EtherscanPreviewBase & {
      readonly type: "etherscan.token";
      readonly token: EtherscanTokenView;
    })
  | (EtherscanPreviewBase & {
      readonly type: "etherscan.nft";
      readonly nft: EtherscanNftView;
    })
  | (EtherscanPreviewBase & {
      readonly type: "etherscan.block";
      readonly block: EtherscanBlockView;
    })
  | (EtherscanPreviewBase & {
      readonly type: "etherscan.uncle";
      readonly uncle: EtherscanSpecialEntityView;
    })
  | (EtherscanPreviewBase & {
      readonly type: "etherscan.blob";
      readonly blob: EtherscanSpecialEntityView;
    })
  | (EtherscanPreviewBase & {
      readonly type: "etherscan.signature";
      readonly signature: EtherscanSpecialEntityView;
    })
  | (EtherscanPreviewBase & {
      readonly type:
        | "etherscan.list"
        | "etherscan.analytics"
        | "etherscan.tool"
        | "etherscan.page";
      readonly page: EtherscanPageView;
    });

export function isEtherscanPreview(value: unknown): value is EtherscanPreview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    record["provider"] === "etherscan" &&
    typeof record["type"] === "string" &&
    record["type"].startsWith("etherscan.")
  );
}
