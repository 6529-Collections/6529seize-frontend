import { TextMatchTransformer } from "@lexical/markdown";
import { $isMentionNode, MentionNode } from "../nodes/MentionNode";

export const MENTION_TRANSFORMER: TextMatchTransformer = {
  dependencies: [MentionNode],
  export: (node) => {
    if (!$isMentionNode(node)) {
      return null;
    }

    const textContent = node.getTextContent();
    return `@[${textContent.substring(1)}]`;
  },
  regExp: /@[\w]+/g,
  replace: (node) => {
    return node;
  },
  importRegExp: /@[\w]+/g,
  trigger: "@",
  type: "text-match",
};
