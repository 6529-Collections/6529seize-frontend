export type AllowlistToolResponse<T> =
  | T
  | { statusCode: number; message: string | string[]; error: string };

export interface AllowlistDescriptionActiveRun {
  readonly id: string;
  readonly createdAt: number;
}

export interface AllowlistDescription {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly createdAt: number;
  readonly activeRun?: AllowlistDescriptionActiveRun;
}

export interface AllowlistTransferPool {
  readonly id: string;
  readonly allowlistId: string;
  readonly transferPoolId: string;
  readonly activeRunId: string;
  readonly name: string;
  readonly description: string;
  readonly contract: string;
  readonly blockNo: number;
}

export interface AllowlistTokenPool {
  readonly id: string;
  readonly allowlistId: string;
  readonly tokenPoolId: string;
  readonly activeRunId?: string;
  readonly transferPoolId: string;
  readonly tokenIds?: string;
  readonly name: string;
  readonly description: string;
}

export interface AllowlistCustomTokenPool {
  readonly id: string;
  readonly allowlistId: string;
  readonly customTokenPoolId: string;
  readonly activeRunId: string;
  readonly name: string;
  readonly description: string;
}

export interface AllowlistWalletPool {
  readonly id: string;
  readonly allowlistId: string;
  readonly walletPoolId: string;
  readonly activeRunId: string;
  readonly name: string;
  readonly description: string;
}

export interface AllowlistPhase {
  readonly id: string;
  readonly allowlistId: string;
  readonly activeRunId: string;
  readonly phaseId: string;
  readonly name: string;
  readonly description: string;
  readonly insertionOrder: number;
}

export interface AllowlistPhaseComponent {
  readonly id: string;
  readonly allowlistId: string;
  readonly phaseId: string;
  readonly componentId: string;
  readonly activeRunId: string;
  readonly insertionOrder: number;
  readonly name: string;
  readonly description: string;
}

export interface AllowlistPhaseComponentItem {
  readonly id: string;
  readonly allowlistId: string;
  readonly phaseId: string;
  readonly phaseComponentId: string;
  readonly phaseComponentItemId: string;
  readonly activeRunId: string;
  readonly insertionOrder: number;
  readonly name: string;
  readonly description: string;
  readonly poolId: string;
  readonly poolType: Pool;
}

export interface AllowlistPhaseComponentWithItems
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
  CREATE_CUSTOM_TOKEN_POOL = "CREATE_CUSTOM_TOKEN_POOL",
  CREATE_WALLET_POOL = "CREATE_WALLET_POOL",
  ADD_PHASE = "ADD_PHASE",
  ADD_COMPONENT = "ADD_COMPONENT",
  ADD_ITEM = "ADD_ITEM",
  COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS = "COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS",
  ITEM_EXCLUE_TOKEN_IDS = "ITEM_EXCLUE_TOKEN_IDS",
  ITEM_SELECT_TOKEN_IDS = "ITEM_SELECT_TOKEN_IDS",
  ITEM_REMOVE_FIRST_N_TOKENS = "ITEM_REMOVE_FIRST_N_TOKENS",
  ITEM_REMOVE_LAST_N_TOKENS = "ITEM_REMOVE_LAST_N_TOKENS",
  ITEM_SELECT_FIRST_N_TOKENS = "ITEM_SELECT_FIRST_N_TOKENS",
  ITEM_SELECT_LAST_N_TOKENS = "ITEM_SELECT_LAST_N_TOKENS",
}

export interface AllowlistOperation {
  readonly id: string;
  readonly createdAt: number;
  readonly order: number;
  readonly activeRunId?: string;
  readonly allowlistId: string;
  readonly code: AllowlistOperationCode;
  readonly params: any;
}

export enum Pool {
  TOKEN_POOL = "TOKEN_POOL",
  CUSTOM_TOKEN_POOL = "CUSTOM_TOKEN_POOL",
  WALLET_POOL = "WALLET_POOL",
}

export interface CustomTokenPoolParamsToken {
  readonly owner: string;
  readonly id?: string;
  readonly since?: number;
}

export type Mutable<T, K extends keyof T> = Omit<T, K> & {
  -readonly [P in K]: T[P];
};

export interface AllowlistOperationDescription {
  readonly code: AllowlistOperationCode;
  readonly title: string;
  readonly description: string;
}

export enum AllowlistRunStatus {
  PENDING = "PENDING",
  CLAIMED = "CLAIMED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface AllowlistRun {
  readonly id: string;
  readonly allowlistId: string;
  readonly status: AllowlistRunStatus;
  readonly createdAt: number;
  readonly claimedAt?: number;
}
