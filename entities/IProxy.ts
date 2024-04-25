
export enum ProxyActionType {
  ALLOCATE_REP = "ALLOCATE_REP",
  ALLOCATE_CIC = "ALLOCATE_CIC",
  CREATE_WAVE = "CREATE_WAVE",
  READ_WAVE = "READ_WAVE",
  CREATE_DROP_TO_WAVE = "CREATE_DROP_TO_WAVE",
  RATE_WAVE_DROP = "RATE_WAVE_DROP",
}

export interface CreateProxyActionBase<T extends ProxyActionType> {
  readonly action_type: T;
  readonly start_time: number;
  readonly end_time: number | null;
}

export interface CreateProxyAllocateCreditBase {
  readonly credit: number;
  readonly group_id: string | null;
}

export interface CreateProxyAllocateRepAction
  extends CreateProxyAllocateCreditBase,
    CreateProxyActionBase<ProxyActionType.ALLOCATE_REP> {
  readonly category: string | null;
}

export interface CreateProxyAllocateCicAction
  extends CreateProxyAllocateCreditBase,
    CreateProxyActionBase<ProxyActionType.ALLOCATE_CIC> {}

export interface CreateProxyCreateWaveAction
  extends CreateProxyActionBase<ProxyActionType.CREATE_WAVE> {}

export interface CreateProxyReadWaveAction
  extends CreateProxyActionBase<ProxyActionType.READ_WAVE> {}

export interface CreateProxyCreateDropToWaveAction
  extends CreateProxyActionBase<ProxyActionType.CREATE_DROP_TO_WAVE> {}

export type CreateProxyAction =
  | CreateProxyAllocateRepAction
  | CreateProxyAllocateCicAction
  | CreateProxyCreateWaveAction
  | CreateProxyReadWaveAction
  | CreateProxyCreateDropToWaveAction;

export interface CreateNewProfileProxy {
  readonly target_id: string;
}

export interface ProfileProxyEntity {
  readonly id: string;
  readonly target_id: string;
  readonly created_at: number;
  readonly created_by_id: string;
}
