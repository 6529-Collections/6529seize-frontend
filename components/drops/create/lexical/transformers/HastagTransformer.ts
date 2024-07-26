import { TextMatchTransformer } from "@lexical/markdown";
import { $isHashtagNode, HashtagNode } from "../nodes/HashtagNode";

export const HASHTAG_TRANSFORMER: TextMatchTransformer = {
  dependencies: [HashtagNode],
  export: (node) => {
    if (!$isHashtagNode(node)) {
      return null;
    }

    const textContent = node.getTextContent();
    return `#[${textContent.substring(1)}]`;
  },
  regExp: /#[\w]+/g,
  replace: (node) => {
    return node;
  },
  importRegExp: /#[\w]+/g,
  trigger: "#",
  type: "text-match",
};
