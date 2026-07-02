"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createRangeSelection,
  $setSelection,
  TextNode,
} from "lexical";
import { EmojiNode } from "@/components/drops/create/lexical/nodes/EmojiNode";
import { useEmoji } from "@/contexts/EmojiContext";

const EMOJI_TEST_REGEX = /:(\w+)/;
export const EMOJI_MATCH_REGEX = /:(\w+):/g;

type EmojiMatch = {
  readonly matchText: string;
  readonly emojiId: string;
  readonly startIndex: number;
  readonly endIndex: number;
};

type SelectionSnapshot = {
  readonly anchorNodeKey: string | null;
  readonly anchorOffset: number;
};

type ReplacementNodes = {
  readonly nodes: (TextNode | EmojiNode)[];
  readonly cursorNode: TextNode | null;
};

const getSelectionSnapshot = (): SelectionSnapshot => {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return { anchorNodeKey: null, anchorOffset: 0 };
  }

  const anchorNode = selection.anchor.getNode();
  return {
    anchorNodeKey: anchorNode.getKey(),
    anchorOffset: selection.anchor.offset,
  };
};

const getEmojiMatches = (textContent: string): EmojiMatch[] =>
  Array.from(textContent.matchAll(EMOJI_MATCH_REGEX), (match) => ({
    matchText: match[0],
    emojiId: match[1] ?? "",
    startIndex: match.index,
    endIndex: match.index + match[0].length,
  }));

const shouldPlaceCursorAfterEmoji = ({
  match,
  node,
  selection,
}: {
  readonly match: EmojiMatch;
  readonly node: TextNode;
  readonly selection: SelectionSnapshot;
}): boolean =>
  selection.anchorNodeKey === node.getKey() &&
  selection.anchorOffset >= match.startIndex &&
  selection.anchorOffset <= match.endIndex;

const appendTrailingText = ({
  lastIndex,
  nodes,
  textContent,
}: {
  readonly lastIndex: number;
  readonly nodes: (TextNode | EmojiNode)[];
  readonly textContent: string;
}) => {
  if (lastIndex >= textContent.length) {
    return;
  }

  const afterText = textContent.slice(lastIndex);
  const lastCreated = nodes.at(-1);
  if (lastCreated instanceof TextNode) {
    lastCreated.setTextContent(lastCreated.getTextContent() + afterText);
    return;
  }

  nodes.push(new TextNode(afterText));
};

const createReplacementNodes = ({
  isEmojiIdValid,
  matches,
  node,
  selection,
  textContent,
}: {
  readonly isEmojiIdValid: (emojiId: string) => boolean;
  readonly matches: EmojiMatch[];
  readonly node: TextNode;
  readonly selection: SelectionSnapshot;
  readonly textContent: string;
}): ReplacementNodes | null => {
  let lastIndex = 0;
  const nodes: (TextNode | EmojiNode)[] = [];
  let cursorNode: TextNode | null = null;

  for (const match of matches) {
    if (match.startIndex > lastIndex) {
      const beforeText = textContent.slice(lastIndex, match.startIndex);
      if (beforeText.length > 0) {
        nodes.push(new TextNode(beforeText));
      }
    }

    if (!isEmojiIdValid(match.emojiId)) {
      nodes.push(new TextNode(match.matchText));
      return null;
    }

    nodes.push(new EmojiNode(match.emojiId));

    const trailingTextNode = new TextNode(" ");
    nodes.push(trailingTextNode);

    if (shouldPlaceCursorAfterEmoji({ match, node, selection })) {
      cursorNode = trailingTextNode;
    }

    lastIndex = match.endIndex;
  }

  appendTrailingText({ lastIndex, nodes, textContent });

  return { nodes, cursorNode };
};

const replaceTextNode = (
  node: TextNode,
  replacementNodes: readonly (TextNode | EmojiNode)[]
) => {
  let previousNode: TextNode | EmojiNode = node;
  for (const replacementNode of replacementNodes) {
    previousNode.insertAfter(replacementNode);
    previousNode = replacementNode;
  }

  node.remove();
};

const restoreCursor = (cursorNode: TextNode | null) => {
  if (cursorNode === null) {
    return;
  }

  const cursorTextNodeKey = cursorNode.getKey();
  const newSelection = $createRangeSelection();
  newSelection.anchor.set(cursorTextNodeKey, 0, "text");
  newSelection.focus.set(cursorTextNodeKey, 0, "text");
  $setSelection(newSelection);
};

function transformEmojiTextToNode(
  editor: LexicalEditor,
  isEmojiIdValid: (emojiId: string) => boolean
) {
  editor.update(() => {
    const selection = getSelectionSnapshot();

    for (const node of $getRoot().getAllTextNodes()) {
      const textContent = node.getTextContent();
      if (!EMOJI_TEST_REGEX.test(textContent)) {
        continue;
      }

      const matches = getEmojiMatches(textContent);
      if (!matches.some(({ emojiId }) => isEmojiIdValid(emojiId))) {
        return;
      }

      const replacement = createReplacementNodes({
        isEmojiIdValid,
        matches,
        node,
        selection,
        textContent,
      });
      if (replacement === null) {
        return;
      }

      replaceTextNode(node, replacement.nodes);
      restoreCursor(replacement.cursorNode);
    }
  });
}

const EmojiPlugin = ({
  disabled = false,
}: {
  readonly disabled?: boolean | undefined;
}) => {
  const [editor] = useLexicalComposerContext();
  const { emojiMap, findNativeEmoji, loadEmojiData } = useEmoji();

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
    if (disabled) {
      return;
    }

    void loadEmojiData();

    transformEmojiTextToNode(editor, isEmojiIdValid);

    return editor.registerTextContentListener((textContent) => {
      if (EMOJI_TEST_REGEX.test(textContent)) {
        transformEmojiTextToNode(editor, isEmojiIdValid);
      }
    });
  }, [disabled, editor, isEmojiIdValid, loadEmojiData]);

  return null;
};

export default EmojiPlugin;
