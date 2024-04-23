export enum ProxyTargetType {
  PROFILE = "PROFILE",
  WAVE = "WAVE",
}

export enum ProxyActionType {
  ALLOCATE_REP = "ALLOCATE_REP",
  ALLOCATE_REP_WITH_CATEGORY = "ALLOCATE_REP_WITH_CATEGORY",
  ALLOCATE_CIC = "ALLOCATE_CIC",
  CREATE_WAVE = "CREATE_WAVE",
  READ_WAVE = "READ_WAVE",
  CREATE_DROP_TO_WAVE = "CREATE_DROP_TO_WAVE",
  RATE_WAVE_DROP = "RATE_WAVE_DROP",
}

export interface ProxyAllocateCreditBase {
  readonly amount: number;
  readonly groupId: string | null;
}

export interface ProxyAllocateRepAction extends ProxyAllocateCreditBase {
  readonly type: ProxyActionType.ALLOCATE_REP;
}

export interface ProxyAllocateRepWithCategoryAction
  extends ProxyAllocateCreditBase {
  readonly type: ProxyActionType.ALLOCATE_REP_WITH_CATEGORY;
  readonly category: string;
}

export interface ProxyAllocateCicAction extends ProxyAllocateCreditBase {
  readonly type: ProxyActionType.ALLOCATE_CIC;
}

export interface ProxyCreateWaveAction {
  readonly type: ProxyActionType.CREATE_WAVE;
}

export interface ProxyReadWaveAction {
  readonly type: ProxyActionType.READ_WAVE;
}

export interface ProxyCreateDropToWaveAction {
  readonly type: ProxyActionType.CREATE_DROP_TO_WAVE;
}

export type ProxyAction =
  | ProxyAllocateRepAction
  | ProxyAllocateRepWithCategoryAction
  | ProxyAllocateCicAction
  | ProxyCreateWaveAction
  | ProxyReadWaveAction
  | ProxyCreateDropToWaveAction;

export interface IProxyCreate {
  readonly targetType: ProxyTargetType;
  readonly targetId: string;
  readonly actions: ProxyAction[];
  readonly startTime: number;
  readonly endTime: number | null;
}
