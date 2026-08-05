export type FlowState = "review" | "submission";

export type TxState =
  | "pending"
  | "awaiting_approval"
  | "submitted"
  | "success"
  | "error";

export type TxEntry = {
  id: string;
  originKey: string;
  label: string;
  state: TxState;
  hash?: `0x${string}` | undefined;
  error?: string | undefined;
};
