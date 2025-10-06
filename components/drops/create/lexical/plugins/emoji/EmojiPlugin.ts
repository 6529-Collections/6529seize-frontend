"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createRangeSelection,
  $setSelection,
  TextNode,
  LexicalEditor,
} from "lexical";
import { EmojiNode } from "@/components/drops/create/lexical/nodes/EmojiNode";
import { useEmoji } from "@/contexts/EmojiContext";

const EMOJI_TEST_REGEX = /:(\w+)/;
export const EMOJI_MATCH_REGEX = /:(\w+):/g;

function transformEmojiTextToNode(
  editor: LexicalEditor,
  isEmojiIdValid: (emojiId: string) => boolean
) {
  editor.update(() => {
    const selectionBefore = $getSelection();
    let anchorNodeKey: string | null = null;
    let anchorOffset = 0;

    if ($isRangeSelection(selectionBefore)) {
      const anchorNode = selectionBefore.anchor.getNode();
      anchorNodeKey = anchorNode.getKey();
      anchorOffset = selectionBefore.anchor.offset;
    }

    const root = $getRoot();
    const textNodes = root.getAllTextNodes();

    for (const node of textNodes) {
      const textContent = node.getTextContent();
      if (!EMOJI_TEST_REGEX.test(textContent)) {
        continue;
      }

      const matches = Array.from(textContent.matchAll(EMOJI_MATCH_REGEX)).map(
        (match) => ({
          matchText: match[0],
          emojiId: match[1],
          startIndex: match.index!,
          endIndex: match.index! + match[0].length,
        })
      );

      if (matches.length === 0) {
        return;
      }

      const hasValidEmoji = matches.some(({ emojiId }) =>
        isEmojiIdValid(emojiId)
      );

      if (!hasValidEmoji) {
        return;
      }

      let lastIndex = 0;
      const newNodes: (TextNode | EmojiNode)[] = [];
      let cursorNode: TextNode | null = null;

      for (const { matchText, emojiId, startIndex, endIndex } of matches) {
        if (startIndex > lastIndex) {
          const beforeStr = textContent.slice(lastIndex, startIndex);
          if (beforeStr.length > 0) {
            newNodes.push(new TextNode(beforeStr));
          }
        }

        if (!isEmojiIdValid(emojiId)) {
          newNodes.push(new TextNode(matchText));
          lastIndex = endIndex;
          return;
        }

        const emojiNode = new EmojiNode(emojiId);
        newNodes.push(emojiNode);

        const trailingTextNode = new TextNode(" ");
        newNodes.push(trailingTextNode);

        if (
          anchorNodeKey === node.getKey() &&
          anchorOffset >= startIndex &&
          anchorOffset <= endIndex
        ) {
          cursorNode = trailingTextNode;
        }

        lastIndex = endIndex;
      }

      if (lastIndex < textContent.length) {
        const afterStr = textContent.slice(lastIndex);
        const lastCreated = newNodes.at(-1);
        if (lastCreated instanceof TextNode) {
          lastCreated.setTextContent(lastCreated.getTextContent() + afterStr);
        } else {
          newNodes.push(new TextNode(afterStr));
        }
      }

      let prev: TextNode | EmojiNode = node;
      for (const newNode of newNodes) {
        prev.insertAfter(newNode);
        prev = newNode;
      }

      node.remove();

      if (cursorNode) {
        const cursorTextNodeKey = (cursorNode as TextNode).getKey();
        const newSelection = $createRangeSelection();
        newSelection.anchor.set(cursorTextNodeKey, 0, "text");
        newSelection.focus.set(cursorTextNodeKey, 0, "text");
        $setSelection(newSelection);
      }
    }
  });
}

const EmojiPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const { emojiMap, findNativeEmoji } = useEmoji();

  const customEmojiIds = useMemo(() => {
    const ids = new Set<string>();
    emojiMap.forEach((category) => {
      category.emojis.forEach((emoji) => {
        ids.add(emoji.id);
      });
    });
    return ids;
  }, [emojiMap]);

  const isEmojiIdValid = useCallback(
    (emojiId: string) => {
      if (customEmojiIds.has(emojiId)) {
        return true;
      }

      return Boolean(findNativeEmoji(emojiId));
    },
    [customEmojiIds, findNativeEmoji]
  );

  useEffect(() => {
    transformEmojiTextToNode(editor, isEmojiIdValid);

    return editor.registerTextContentListener((textContent) => {
      if (EMOJI_TEST_REGEX.test(textContent)) {
        transformEmojiTextToNode(editor, isEmojiIdValid);
      }
    });
  }, [editor, isEmojiIdValid]);

  return null;
};

export default EmojiPlugin;
