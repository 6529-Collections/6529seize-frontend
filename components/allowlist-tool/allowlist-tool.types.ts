export type AllowlistToolResponse<T> =
  | T
  | { statusCode: number; message: string | string[]; error: string };

interface AllowlistDescriptionActiveRun {
  readonly createdAt: number;
  readonly updatedAt?: number | undefined;
  readonly status?: AllowlistRunStatus | undefined;
  readonly errorReason: string | null;
}

export interface AllowlistDescription {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly createdAt: number;
  readonly activeRun?: AllowlistDescriptionActiveRun | undefined;
}

export interface AllowlistTransferPool {
  readonly id: string;
  readonly allowlistId: string;
  readonly name: string;
  readonly description: string;
  readonly contract: string;
  readonly blockNo: number;
  readonly transfersCount: number;
}

export interface AllowlistTokenPool {
  readonly id: string;
  readonly allowlistId: string;
  readonly tokenIds?: string | undefined;
  readonly name: string;
  readonly description: string;
  readonly walletsCount: number;
  readonly tokensCount: number;
}

export interface AllowlistCustomTokenPool {
  readonly id: string;
  readonly allowlistId: string;
  readonly name: string;
  readonly description: string;
  readonly walletsCount: number;
  readonly tokensCount: number;
}

interface AllowlistPhase {
  readonly id: string;
  readonly allowlistId: string;
  readonly name: string;
  readonly description: string;
  readonly insertionOrder: number;
  readonly walletsCount: number;
  readonly tokensCount: number;
  readonly winnersWalletsCount: number;
  readonly winnersSpotsCount: number;
}

interface AllowlistPhaseComponent {
  readonly id: string;
  readonly allowlistId: string;
  readonly phaseId: string;
  readonly insertionOrder: number;
  readonly name: string;
  readonly description: string;
  readonly walletsCount: number;
  readonly tokensCount: number;
  readonly winnersWalletsCount: number;
  readonly winnersSpotsCount: number;
}

interface AllowlistPhaseComponentItem {
  readonly id: string;
  readonly allowlistId: string;
  readonly phaseId: string;
  readonly phaseComponentId: string;
  readonly insertionOrder: number;
  readonly name: string;
  readonly description: string;
  readonly poolId: string;
  readonly poolType: Pool;
  readonly walletsCount: number;
  readonly tokensCount: number;
}

interface AllowlistPhaseComponentWithItems
  extends AllowlistPhaseComponent {
  readonly items: AllowlistPhaseComponentItem[];
}

export interface AllowlistPhaseWithComponentAndItems extends AllowlistPhase {
  readonly components: AllowlistPhaseComponentWithItems[];
}

export enum AllowlistOperationCode {
  CREATE_ALLOWLIST = "CREATE_ALLOWLIST",
  GET_COLLECTION_TRANSFERS = "GET_COLLECTION_TRANSFERS",
  CREATE_TOKEN_POOL = "CREATE_TOKEN_POOL",
  TOKEN_POOL_CONSOLIDATE_WALLETS = "TOKEN_POOL_CONSOLIDATE_WALLETS", // Not fully implemented to Allowlist-Tool
  CREATE_CUSTOM_TOKEN_POOL = "CREATE_CUSTOM_TOKEN_POOL",
  CREATE_WALLET_POOL = "CREATE_WALLET_POOL",
  ADD_PHASE = "ADD_PHASE",
  ADD_COMPONENT = "ADD_COMPONENT",
  ADD_ITEM = "ADD_ITEM",
  COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS = "COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS",
  COMPONENT_ADD_SPOTS_TO_WALLETS_EXCLUDING_CERTAIN_COMPONENTS = "COMPONENT_ADD_SPOTS_TO_WALLETS_EXCLUDING_CERTAIN_COMPONENTS",
  COMPONENT_SELECT_RANDOM_WALLETS = "COMPONENT_SELECT_RANDOM_WALLETS", // Not fully implemented to Allowlist-Tool
  COMPONENT_SELECT_RANDOM_PERCENTAGE_WALLETS = "COMPONENT_SELECT_RANDOM_PERCENTAGE_WALLETS", // Not fully implemented to Allowlist-Tool
  MAP_RESULTS_TO_DELEGATED_WALLETS = "MAP_RESULTS_TO_DELEGATED_WALLETS", // Not fully implemented to Allowlist-Tool
  ITEM_EXCLUE_TOKEN_IDS = "ITEM_EXCLUE_TOKEN_IDS",
  ITEM_SELECT_TOKEN_IDS = "ITEM_SELECT_TOKEN_IDS",
  ITEM_REMOVE_FIRST_N_TOKENS = "ITEM_REMOVE_FIRST_N_TOKENS",
  ITEM_REMOVE_LAST_N_TOKENS = "ITEM_REMOVE_LAST_N_TOKENS",
  ITEM_SELECT_FIRST_N_TOKENS = "ITEM_SELECT_FIRST_N_TOKENS",
  ITEM_SELECT_LAST_N_TOKENS = "ITEM_SELECT_LAST_N_TOKENS",
  ITEM_REMOVE_WALLETS_FROM_CERTAIN_COMPONENTS = "ITEM_REMOVE_WALLETS_FROM_CERTAIN_COMPONENTS", // Not fully implemented to Allowlist-Tool
  ITEM_REMOVE_WALLETS_FROM_CERTAIN_TOKEN_POOLS = "ITEM_REMOVE_WALLETS_FROM_CERTAIN_TOKEN_POOLS", // Not fully implemented to Allowlist-Tool
  ITEM_SORT_WALLETS_BY_TOTAL_TOKENS_COUNT = "ITEM_SORT_WALLETS_BY_TOTAL_TOKENS_COUNT", // Not fully implemented to Allowlist-Tool
  ITEM_SORT_WALLETS_BY_UNIQUE_TOKENS_COUNT = "ITEM_SORT_WALLETS_BY_UNIQUE_TOKENS_COUNT", // Not fully implemented to Allowlist-Tool
  ITEM_REMOVE_FIRST_N_WALLETS = "ITEM_REMOVE_FIRST_N_WALLETS", // Not fully implemented to Allowlist-Tool
  ITEM_SELECT_FIRST_N_WALLETS = "ITEM_SELECT_FIRST_N_WALLETS", // Not fully implemented to Allowlist-Tool
  ITEM_SORT_WALLETS_BY_MEMES_TDH = "ITEM_SORT_WALLETS_BY_MEMES_TDH", // Not fully implemented to Allowlist-Tool
  ITEM_SELECT_WALLETS_OWNING_TOKEN_IDS = "ITEM_SELECT_WALLETS_OWNING_TOKEN_IDS", // Not fully implemented to Allowlist-Tool
}

export interface AllowlistOperationBase {
  readonly code: AllowlistOperationCode;
  readonly params: Record<string, any>;
}

export interface AllowlistOperation extends AllowlistOperationBase {
  readonly id: string;
  readonly createdAt: number;
  readonly order: number;
  readonly allowlistId: string;
  readonly hasRan: boolean;
}

export enum Pool {
  TOKEN_POOL = "TOKEN_POOL",
  CUSTOM_TOKEN_POOL = "CUSTOM_TOKEN_POOL",
  WALLET_POOL = "WALLET_POOL",
}

export interface CustomTokenPoolParamsToken {
  readonly owner: string;
  readonly id?: string | undefined;
}

export type Mutable<T, K extends keyof T> = Omit<T, K> & {
  -readonly [P in K]: T[P];
};

export enum AllowlistRunStatus {
  PENDING = "PENDING",
  CLAIMED = "CLAIMED",
  FAILED = "FAILED",
}

export interface AllowlistResult {
  readonly id: string;
  readonly wallet: string;
  readonly phaseId: string;
  readonly allowlistId: string;
  readonly phaseComponentId: string;
  readonly amount: number;
}

export interface DistributionPlanSearchContractMetadataResult {
  readonly id: string;
  readonly address: string;
  readonly name: string;
  readonly tokenType: string;
  readonly floorPrice: number | null;
  readonly imageUrl: string | null;
  readonly description: string | null;
  readonly allTimeVolume: number | null;
  readonly openseaVerified: boolean;
}

export enum DistributionPlanTokenPoolDownloadStatus {
  PENDING = "PENDING",
  CLAIMED = "CLAIMED",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
}

export interface DistributionPlanTokenPoolDownload {
  readonly contract: string;
  readonly tokenIds?: string | undefined;
  readonly tokenPoolId: string;
  readonly allowlistId: string;
  readonly blockNo: number;
  readonly status: DistributionPlanTokenPoolDownloadStatus;
}

export interface DistributionPlanSnapshotToken {
  readonly contract: string;
  readonly tokenId: string;
  readonly amount: number;
  readonly wallet: string;
}

export interface ResolvedEns {
  readonly ens: string;
  readonly address: string | null;
}
