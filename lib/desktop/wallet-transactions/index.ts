/**
 * Wallet transactions for 6529 Desktop: the allow-list of 6529 contract
 * calls that may be sent through browser-wallet forwarding, with strict
 * decoding and the canonical rules hash both sides compare.
 */

export { WALLET_TRANSACTION_RULES } from "./rules";
export {
  canonicalTransactionRulesJson,
  transactionRulesHash,
  walletTransactionRulesHash,
} from "./hash";
export { decodeTransactionData, type DecodedArgs } from "./decode";
export {
  checkWalletTransaction,
  findTransactionRule,
  type WalletTransaction,
  type WalletTransactionCheck,
  type WalletTransactionProblem,
} from "./check";
export type { TransactionRisk, TransactionRule } from "./types";
