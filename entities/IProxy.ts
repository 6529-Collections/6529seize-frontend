import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

interface CreateProxyActionBase<T extends ApiProfileProxyActionType> {
  readonly action_type: T;
  readonly end_time: number | null;
}

interface CreateProxyAllocateCreditBase {
  readonly credit_amount: number;
}

export interface CreateProxyAllocateRepAction
  extends CreateProxyAllocateCreditBase,
    CreateProxyActionBase<ApiProfileProxyActionType.AllocateRep> {}

export interface CreateProxyAllocateCicAction
  extends CreateProxyAllocateCreditBase,
    CreateProxyActionBase<ApiProfileProxyActionType.AllocateCic> {}

export interface CreateProxyCreateWaveAction
  extends CreateProxyActionBase<ApiProfileProxyActionType.CreateWave> {}

export interface CreateProxyReadWaveAction
  extends CreateProxyActionBase<ApiProfileProxyActionType.ReadWave> {}

export interface CreateProxyCreateDropToWaveAction
  extends CreateProxyActionBase<ApiProfileProxyActionType.CreateDropToWave> {}

export interface CreateProxyRateWaveDropAction
  extends CreateProxyActionBase<ApiProfileProxyActionType.RateWaveDrop> {}

export type CreateProxyAction =
  | CreateProxyAllocateRepAction
  | CreateProxyAllocateCicAction
  | CreateProxyCreateWaveAction
  | CreateProxyReadWaveAction
  | CreateProxyCreateDropToWaveAction
  | CreateProxyRateWaveDropAction;

interface CreateNewProfileProxy {
  readonly target_id: string;
}

export const PROFILE_PROXY_ACTION_LABELS: Record<
  ApiProfileProxyActionType,
  string
> = {
  [ApiProfileProxyActionType.AllocateRep]: "Allocate Rep",
  [ApiProfileProxyActionType.AllocateCic]: "Allocate NIC",
  [ApiProfileProxyActionType.CreateWave]: "Create Wave",
  [ApiProfileProxyActionType.ReadWave]: "Read Wave",
  [ApiProfileProxyActionType.CreateDropToWave]: "Create Drop To Wave",
  [ApiProfileProxyActionType.RateWaveDrop]: "Rate Wave Drop",
};

export enum ProfileProxySide {
  GRANTED = "GRANTED",
  RECEIVED = "RECEIVED",
}

export enum ProfileProxyActionStatus {
  REJECTED = "REJECTED",
  REVOKED = "REVOKED",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
}

export const PROFILE_PROXY_ACTION_HAVE_CREDIT: Record<
  ApiProfileProxyActionType,
  boolean
> = {
  [ApiProfileProxyActionType.AllocateRep]: true,
  [ApiProfileProxyActionType.AllocateCic]: true,
  [ApiProfileProxyActionType.CreateWave]: false,
  [ApiProfileProxyActionType.ReadWave]: false,
  [ApiProfileProxyActionType.CreateDropToWave]: false,
  [ApiProfileProxyActionType.RateWaveDrop]: false,
};

export const PROFILE_PROXY_AVAILABLE_ACTIONS: ApiProfileProxyActionType[] = [
  ApiProfileProxyActionType.AllocateRep,
  ApiProfileProxyActionType.AllocateCic,
];
