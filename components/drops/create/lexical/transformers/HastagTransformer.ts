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
  regExp: /#\[[\w]+\]/g,
  importRegExp: /#\[[\w]+\]/g,
  replace: (textNode, match) => {
    const [fullMatch] = match;
    console.log("[HashtagTransformer] Replace - processing:", fullMatch);
    console.log("[HashtagTransformer] Replace - textNode content before:", textNode.getTextContent());
    
    const tag = fullMatch.slice(2, -1); // Remove #[ and ]
    console.log("[HashtagTransformer] Replace - extracted tag:", tag);
    
    const hashtagNode = $createHashtagNode(`#${tag}`);
    console.log("[HashtagTransformer] Replace - created node text:", hashtagNode.getTextContent());
    
    // Get the full text content and find the exact position of our match
    const fullText = textNode.getTextContent();
    const matchStartIndex = fullText.indexOf(fullMatch);
    
    if (matchStartIndex === -1) {
      console.error("[HashtagTransformer] Replace - could not find match in text!");
      return;
    }
    
    console.log("[HashtagTransformer] Replace - match found at index:", matchStartIndex);
    
    // If the match is at the beginning of the text node
    if (matchStartIndex === 0) {
      // Split after the match and replace the first part
      const endIndex = fullMatch.length;
      if (endIndex < fullText.length) {
        // There's text after the match, split it
        textNode.splitText(endIndex);
        console.log("[HashtagTransformer] Replace - split at index:", endIndex);
      }
      textNode.replace(hashtagNode);
    } else {
      // Match is in the middle or at the end, split before it
      const splitNodes = textNode.splitText(matchStartIndex);
      console.log("[HashtagTransformer] Replace - split at index:", matchStartIndex);
      console.log("[HashtagTransformer] Replace - first part after split:", textNode.getTextContent());
      console.log("[HashtagTransformer] Replace - second part after split:", splitNodes[0]?.getTextContent());
      
      // The node containing our match is now in splitNodes[0]
      const nodeWithMatch = splitNodes[0];
      if (!nodeWithMatch) {
        console.error("[HashtagTransformer] Replace - no node after split!");
        return;
      }
      
      // Now split after the match if there's remaining text
      const matchEndIndex = fullMatch.length;
      if (matchEndIndex < nodeWithMatch.getTextContent().length) {
        nodeWithMatch.splitText(matchEndIndex);
        console.log("[HashtagTransformer] Replace - split match node at index:", matchEndIndex);
      }
      
      nodeWithMatch.replace(hashtagNode);
    }
    
    console.log("[HashtagTransformer] Replace - completed");
  },
  trigger: "#",
  type: "text-match",
};
