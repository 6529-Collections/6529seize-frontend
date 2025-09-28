"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isTextNode, TextNode } from "lexical";

const NBSP = "\u00A0";

const isNonWhitespace = (char: string | undefined) =>
  !!char && !/\s/.test(char);

const removeInWordNbsp = (text: string): string => {
  if (!text.includes(NBSP)) {
    return text;
  }

  let result = "";
  let didModify = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === NBSP) {
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
  const previousSibling = node.getPreviousSibling();
  if ($isTextNode(previousSibling) && canMerge(previousSibling, node)) {
    previousSibling.mergeWithSibling(node);
    return;
  }

  const nextSibling = node.getNextSibling();
  if ($isTextNode(nextSibling) && canMerge(node, nextSibling)) {
    node.mergeWithSibling(nextSibling);
  }
};

const isIosUserAgent = () =>
  typeof navigator !== "undefined" &&
  /iP(ad|hone|od)/i.test(navigator.userAgent);

const NormalizeTextNodesPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const shouldNormalize = isIosUserAgent();

  useEffect(() => {
    if (!shouldNormalize) {
      return;
    }

    return editor.registerNodeTransform(TextNode, (node) => {
      if (!node.isSimpleText()) {
        return;
      }

      const normalized = removeInWordNbsp(node.getTextContent());
      if (normalized !== node.getTextContent()) {
        node.setTextContent(normalized);
      }

      mergeAdjacentIfPossible(node);
    });
  }, [editor, shouldNormalize]);

  return null;
};

export default NormalizeTextNodesPlugin;
