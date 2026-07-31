import { $isCodeNode } from "@lexical/code";
import { $isLinkNode } from "@lexical/link";
import type { LexicalNode } from "lexical";

export const isInsideCodeOrLink = (node: LexicalNode): boolean => {
  let parent = node.getParent();
  while (parent) {
    if ($isCodeNode(parent) || $isLinkNode(parent)) {
      return true;
    }
    parent = parent.getParent();
  }
  return false;
};
