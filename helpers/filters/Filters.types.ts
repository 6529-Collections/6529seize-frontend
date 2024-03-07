export interface CommunitySearchCriteria {
  readonly id: string;
  readonly criteria: Operation[];
}

export enum OpCode {
  EQ = "EQ",
  GTE = "GTE",
  LTE = "LTE",
  EXTRACT = "EXTRACT",
}

export type PrimitiveValueOpCode = OpCode.EQ | OpCode.GTE | OpCode.LTE;
export type ExtractOpCode = OpCode.EXTRACT;

export enum CSRepExchangeProp {
  FROM_PROFILE_ID = "rep_exchange_from_profile_id",
  TO_PROFILE_ID = "rep_exchange_to_profile_id",
  CATEGORY = "rep_exchange_category",
  AMOUNT = "rep_exchange_amount",
}

export enum CSCicExchangeProp {
  FROM_PROFILE_ID = "cic_exchange_from_profile_id",
  TO_PROFILE_ID = "cic_exchange_to_profile_id",
  AMOUNT = "cic_exchange_amount",
}

export enum CsExtractProp {
  REP = "rep",
  CIC = "cic",
}

export enum CSProfileProp {
  TDH = "tdh",
  REP = "rep",
  CIC = "cic",
  LEVEL = "level",
}

export type PrimitivePropertyKey =
  | CSRepExchangeProp
  | CSCicExchangeProp
  | CSProfileProp
  | CsExtractProp;

export interface PrimitiveValueOp<T extends PrimitiveValueOpCode> {
  readonly op: T;
  readonly property_key: PrimitivePropertyKey;
  readonly property_value: string;
}

export interface ExtractOp {
  readonly op: OpCode.EXTRACT;
  readonly property_key: CsExtractProp;
  readonly property_value: "receiver" | "sender";
}

export type EqOp = PrimitiveValueOp<OpCode.EQ>;
export type GteOp = PrimitiveValueOp<OpCode.GTE>;
export type LteOp = PrimitiveValueOp<OpCode.LTE>;

export type Operation = EqOp | GteOp | LteOp | ExtractOp;
