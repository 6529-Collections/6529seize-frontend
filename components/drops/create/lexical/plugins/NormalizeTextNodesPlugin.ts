"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isTextNode, TextNode } from "lexical";

const IN_WORD_INVISIBLE_CHARS = new Set([
  "\u00A0", // non-breaking space
  "\u2007", // figure space
  "\u202F", // narrow non-breaking space
  "\u2060", // word joiner
  "\u2063", // invisible separator
  "\u200B", // zero width space
  "\u200C", // zero width non-joiner
  "\u200D", // zero width joiner
  "\uFEFF", // zero width no-break space
]);

const isNonWhitespace = (char: string | undefined) =>
  !!char && !/\s/.test(char);

const removeInWordArtifacts = (text: string): string => {
  let result = "";
  let didModify = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (IN_WORD_INVISIBLE_CHARS.has(char)) {
      const prev = text[index - 1];
      const next = text[index + 1];

      if (isNonWhitespace(prev) && isNonWhitespace(next)) {
        didModify = true;
        continue;
      }
    }

    result += char;
  }

  return didModify ? result : text;
};

const canMerge = (a: TextNode, b: TextNode): boolean => {
  if (a.isUnmergeable() || b.isUnmergeable()) {
    return false;
  }

  if (a.getMode() !== b.getMode()) {
    return false;
  }

  if (a.getFormat() !== b.getFormat()) {
    return false;
  }

  if (a.getStyle() !== b.getStyle()) {
    return false;
  }

  return true;
};

const mergeAdjacentIfPossible = (node: TextNode) => {
  let current: TextNode = node;

  let previousSibling = current.getPreviousSibling();
  while ($isTextNode(previousSibling) && canMerge(previousSibling, current)) {
    current = previousSibling.mergeWithSibling(current);
    previousSibling = current.getPreviousSibling();
  }

  let nextSibling = current.getNextSibling();
  while ($isTextNode(nextSibling) && canMerge(current, nextSibling)) {
    current = current.mergeWithSibling(nextSibling);
    nextSibling = current.getNextSibling();
  }
};

const NormalizeTextNodesPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (node) => {
      if (node.getType() !== "text") {
        return;
      }

      const normalized = removeInWordArtifacts(node.getTextContent());
      if (normalized !== node.getTextContent()) {
        node.setTextContent(normalized);
      }

      mergeAdjacentIfPossible(node);
    });
  }, [editor]);

  return null;
};

export default NormalizeTextNodesPlugin;
