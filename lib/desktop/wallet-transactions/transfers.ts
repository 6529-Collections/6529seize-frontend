/**
 * Wallet transactions for 6529 Desktop: whether an NFT transfer the
 * transfer flow is about to send is on the allow-list, so the flow can
 * offer it through browser-wallet forwarding instead of pointing to the
 * website.
 */

import {
  MAX_TRANSFER_AMOUNT,
  MAX_TRANSFER_BATCH_TOKENS,
  TRANSFER_RULES,
  TRANSFER_RECIPIENT_EXCLUDED,
} from "./transfer-rules";

/** One selected NFT: its contract, token standard and copies. */
interface TransferSelection {
  readonly contract: string;
  readonly tokenId: string;
  readonly erc1155: boolean;
  readonly quantity: number;
}

/** Sender and recipient (the recipient null while none is chosen). */
interface TransferParties {
  readonly from: string | null;
  readonly to: string | null;
}

/** A recipient the transfer rules would refuse for every contract. */
function isExcludedRecipient({ from, to }: TransferParties): boolean {
  if (to === null) return false;
  const recipient = to.toLowerCase();
  return (
    TRANSFER_RECIPIENT_EXCLUDED.includes(recipient) ||
    (from !== null && recipient === from.toLowerCase())
  );
}

/**
 * True when every selected NFT is on a contract the transfer rules list
 * for `chainId` (with its standard), each ERC-1155 selection is at most
 * the copy cap, no ERC-1155 contract has more different tokens than one
 * batch transfer may move, and the chosen recipient is one the rules
 * accept (not the sender, the zero or burn address, or the contract).
 */
export function canForwardTransfer(
  chainId: number,
  selection: readonly TransferSelection[],
  parties: TransferParties = { from: null, to: null }
): boolean {
  if (selection.length === 0 || isExcludedRecipient(parties)) return false;
  const tokensByContract = new Map<string, Set<string>>();
  for (const item of selection) {
    const contract = item.contract.toLowerCase();
    const ruleId = item.erc1155 ? "nft.batchTransfer1155" : "nft.transfer721";
    const listed = TRANSFER_RULES.some(
      (rule) =>
        rule.id === ruleId && rule.chainId === chainId && rule.to === contract
    );
    if (!listed) return false;
    if (parties.to !== null && parties.to.toLowerCase() === contract) {
      return false;
    }
    if (item.erc1155 && item.quantity > MAX_TRANSFER_AMOUNT) return false;
    const tokens = tokensByContract.get(contract) ?? new Set<string>();
    tokens.add(item.tokenId);
    tokensByContract.set(contract, tokens);
    if (item.erc1155 && tokens.size > MAX_TRANSFER_BATCH_TOKENS) return false;
  }
  return true;
}
