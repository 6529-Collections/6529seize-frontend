import { Pool } from "@/components/allowlist-tool/allowlist-tool.types";
import { ComponentRandomHoldersWeightType } from "./component-config/utils/ComponentRandomHoldersWeight";

export enum PhaseConfigStep {
  SELECT_SNAPSHOT = "SELECT_SNAPSHOT",
  SNAPSHOT_EXCLUDE_OTHER_SNAPSHOTS = "SNAPSHOT_EXCLUDE_OTHER_SNAPSHOTS",
  SNAPSHOT_EXCLUDE_COMPONENT_WINNERS = "SNAPSHOT_EXCLUDE_COMPONENT_WINNERS",
  SNAPSHOT_SELECT_TOKEN_IDS = "SNAPSHOT_SELECT_TOKEN_IDS",
  SNAPSHOT_SELECT_TOP_HOLDERS = "SNAPSHOT_SELECT_TOP_HOLDERS",
  FINALIZE_SNAPSHOT = "FINALIZE_SNAPSHOT",
  COMPONENT_SELECT_RANDOM_HOLDERS = "COMPONENT_SELECT_RANDOM_HOLDERS",
  COMPONENT_ADD_SPOTS = "COMPONENT_ADD_SPOTS",
  FINALIZE_COMPONENTS = "FINALIZE_COMPONENTS",
}

export enum TopHolderType {
  TOTAL_TOKENS_COUNT = "TOTAL_TOKENS_COUNT",
  UNIQUE_TOKENS_COUNT = "UNIQUE_TOKENS_COUNT",
  MEMES_TDH = "MEMES_TDH",
}

export enum RandomHoldersType {
  BY_COUNT = "BY_COUNT",
  BY_PERCENTAGE = "BY_PERCENTAGE",
}

export interface DistributionPlanSnapshot {
  readonly id: string;
  readonly name: string;
  readonly poolType: Pool;
  readonly walletsCount: number | null;
}

export interface PhaseGroupSnapshotConfigExcludeSnapshot {
  readonly snapshotId: string;
  readonly snapshotType: Pool;
  readonly extraWallets: string[];
}

export interface PhaseGroupSnapshotConfig {
  groupSnapshotId: string | null;
  snapshotId: string | null;
  snapshotType: Pool | null;
  snapshotSchema: string | null;
  excludeComponentWinners: string[];
  excludeSnapshots: PhaseGroupSnapshotConfigExcludeSnapshot[];
  topHoldersFilter: {
    type: TopHolderType;
    from: number | null;
    to: number | null;
    tdhBlockNumber: number | null;
  } | null;
  tokenIds: string | null;
  uniqueWalletsCount: number | null;
}

export interface PhaseGroupConfig {
  snapshots: PhaseGroupSnapshotConfig[];
  randomHoldersFilter: {
    type: RandomHoldersType;
    value: number;
    weightType: ComponentRandomHoldersWeightType;
    seed: string;
  } | null;
  maxMintCount: number | null;
  uniqueWalletsCount: number | null;
}
