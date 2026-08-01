import type { TextMatchTransformer } from "@lexical/markdown";
import {
  $createWaveMentionNode,
  $isWaveMentionNode,
  WaveMentionNode,
} from "../nodes/WaveMentionNode";

export const WAVE_MENTION_TRANSFORMER: TextMatchTransformer = {
  dependencies: [WaveMentionNode],
  export: (node) => {
    if (!$isWaveMentionNode(node)) {
      return null;
    }

    const textContent = node.getTextContent();
    return `#[${textContent.substring(1)}]`;
  },
  // Allow spaces in wave names within bracketed format.
  // NOT global — see MentionTransformer: a `g` flag makes `String.match` drop
  // `match.index`, so `@lexical/markdown` splits the text node at the wrong
  // offset and only a token at position 0 survives.
  regExp: /#\[[^\]\n]+\]/,
  importRegExp: /#\[[^\]\n]+\]/,
  replace: (textNode, match) => {
    const [fullMatch] = match;
    const fullText = textNode.getTextContent();

    if (!fullText.includes(fullMatch)) {
      return;
    }

    const waveName = fullMatch.slice(2, -1); // Remove #[ and ]
    const mentionNode = $createWaveMentionNode(`#${waveName}`);
    textNode.replace(mentionNode);
  },
  trigger: "#",
  type: "text-match",
};
