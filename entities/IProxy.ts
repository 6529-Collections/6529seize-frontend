import { ProfileProxyActionType } from "../generated/models/ProfileProxyActionType";

export interface CreateProxyActionBase<T extends ProfileProxyActionType> {
  readonly action_type: T;
  readonly end_time: number | null;
}

export interface CreateProxyAllocateCreditBase {
  readonly credit_amount: number;
}

export interface CreateProxyAllocateRepAction
  extends CreateProxyAllocateCreditBase,
    CreateProxyActionBase<ProfileProxyActionType.AllocateRep> {}

export interface CreateProxyAllocateCicAction
  extends CreateProxyAllocateCreditBase,
    CreateProxyActionBase<ProfileProxyActionType.AllocateCic> {}

export interface CreateProxyCreateWaveAction
  extends CreateProxyActionBase<ProfileProxyActionType.CreateWave> {}

export interface CreateProxyReadWaveAction
  extends CreateProxyActionBase<ProfileProxyActionType.ReadWave> {}

export interface CreateProxyCreateDropToWaveAction
  extends CreateProxyActionBase<ProfileProxyActionType.CreateDropToWave> {}

export interface CreateProxyRateWaveDropAction
  extends CreateProxyActionBase<ProfileProxyActionType.RateWaveDrop> {}

export type CreateProxyAction =
  | CreateProxyAllocateRepAction
  | CreateProxyAllocateCicAction
  | CreateProxyCreateWaveAction
  | CreateProxyReadWaveAction
  | CreateProxyCreateDropToWaveAction
  | CreateProxyRateWaveDropAction;

export interface CreateNewProfileProxy {
  readonly target_id: string;
}

export const PROFILE_PROXY_ACTION_LABELS: Record<
  ProfileProxyActionType,
  string
> = {
  [ProfileProxyActionType.AllocateRep]: "Allocate Rep",
  [ProfileProxyActionType.AllocateCic]: "Allocate Cic",
  [ProfileProxyActionType.CreateWave]: "Create Wave",
  [ProfileProxyActionType.ReadWave]: "Read Wave",
  [ProfileProxyActionType.CreateDropToWave]: "Create Drop To Wave",
  [ProfileProxyActionType.RateWaveDrop]: "Rate Wave Drop",
};

export enum ProfileProxyActionStatus {
  REJECTED = "REJECTED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
  NOT_STARTED = "NOT_STARTED",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
}

