import { TextMatchTransformer } from "@lexical/markdown";
import { $createHashtagNode, $isHashtagNode, HashtagNode } from "../nodes/HashtagNode";

export const HASHTAG_TRANSFORMER: TextMatchTransformer = {
  dependencies: [HashtagNode],
  export: (node) => {
    if (!$isHashtagNode(node)) {
      return null;
    }

    const textContent = node.getTextContent();
    return `#[${textContent.substring(1)}]`;
  },
  // Only process bracketed format to avoid conflicts  
  regExp: /#\[\w+\]/g,
  importRegExp: /#\[\w+\]/g,
  replace: (textNode, match) => {
    const [fullMatch] = match;
    const fullText = textNode.getTextContent();
    
    // Only process if the full match is actually in this text node
    if (!fullText.includes(fullMatch)) {
      return;
    }
    
    const tag = fullMatch.slice(2, -1); // Remove #[ and ]
    const hashtagNode = $createHashtagNode(`#${tag}`);
    textNode.replace(hashtagNode);
  },
  trigger: "#",
  type: "text-match",
};
