/**
 * Explicit lifecycle of a user action. Pure and dependency-free apart from
 * the chain status ladder it delegates chain stages to.
 */
export {
  DEFAULT_RETRY_POLICY,
  createActionState,
  isTerminalActionState,
  nextRetryAt,
  step,
  transition,
} from "./machine";
export { actionLabel, type ActionLabel, type ActionLabelKey } from "./labels";
export {
  setIllegalTransitionReporter,
  type IllegalTransition,
  type IllegalTransitionReporter,
} from "./report";
export { CHAIN_LABEL_RANK } from "./chain";
export type {
  ActionEvent,
  ActionEventType,
  ActionMode,
  ActionState,
  ActionStateKind,
  ChainProgress,
  RetryPolicy,
  TransitionResult,
} from "./types";
