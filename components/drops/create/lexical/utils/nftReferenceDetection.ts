import { $getRoot, type EditorState } from "lexical";
import { getAddress, isAddress } from "viem";

import { $isHashtagNode } from "@/components/drops/create/lexical/nodes/HashtagNode";
import type { ReferencedNft } from "@/entities/IDrop";

const getNftKey = (nft: ReferencedNft): string | null => {
  const normalizedContract = nft.contract.toLowerCase();
  if (!isAddress(normalizedContract)) {
    return null;
  }
  return `${getAddress(normalizedContract)}:${nft.token}`;
};

/** Reads NFT identities that were persisted with their editor nodes. */
export const getReferencedNftsFromEditorState = (
  editorState: EditorState
): ReferencedNft[] => {
  return editorState.read(() => {
    const byNft = new Map<string, ReferencedNft>();

    for (const node of $getRoot().getAllTextNodes()) {
      if (!$isHashtagNode(node)) {
        continue;
      }
      const referencedNft = node.getReferencedNft();
      if (!referencedNft) {
        continue;
      }
      const key = getNftKey(referencedNft);
      if (!key) {
        continue;
      }
      if (!byNft.has(key)) {
        byNft.set(key, referencedNft);
      }
    }

    return [...byNft.values()];
  });
};

/** Keeps session-only entries while preferring identities restored in-editor. */
export const mergeReferencedNfts = (
  editorReferences: readonly ReferencedNft[],
  registryReferences: readonly ReferencedNft[]
): ReferencedNft[] => {
  const byNft = new Map<string, ReferencedNft>();
  for (const referencedNft of [...registryReferences, ...editorReferences]) {
    const key = getNftKey(referencedNft);
    if (key) {
      byNft.set(key, referencedNft);
    }
  }
  return [...byNft.values()];
};
