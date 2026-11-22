/**
 * Wallet transactions for 6529 Desktop: whether an NFT transfer the
 * transfer flow is about to send is on the allow-list, so the flow can
 * offer it through browser-wallet forwarding instead of pointing to the
 * website.
 */

import { MAX_TRANSFER_BATCH_TOKENS, TRANSFER_RULES } from "./transfer-rules";

/** One selected NFT: its contract and token standard. */
interface TransferSelection {
  readonly contract: string;
  readonly tokenId: string;
  readonly erc1155: boolean;
}

/**
 * True when every selected NFT is on a contract the transfer rules list
 * for `chainId` (with its standard) and no ERC-1155 contract has more
 * different tokens than one batch transfer may move.
 */
export function canForwardTransfer(
  chainId: number,
  selection: readonly TransferSelection[]
): boolean {
  if (selection.length === 0) return false;
  const tokensByContract = new Map<string, Set<string>>();
  for (const item of selection) {
    const contract = item.contract.toLowerCase();
    const ruleId = item.erc1155 ? "nft.batchTransfer1155" : "nft.transfer721";
    const listed = TRANSFER_RULES.some(
      (rule) =>
        rule.id === ruleId && rule.chainId === chainId && rule.to === contract
    );
    if (!listed) return false;
    const tokens = tokensByContract.get(contract) ?? new Set<string>();
    tokens.add(item.tokenId);
    tokensByContract.set(contract, tokens);
    if (item.erc1155 && tokens.size > MAX_TRANSFER_BATCH_TOKENS) return false;
  }
  return true;
}
