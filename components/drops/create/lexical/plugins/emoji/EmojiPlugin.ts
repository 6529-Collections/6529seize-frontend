import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $getNodeByKey,
  $isRangeSelection,
  $createRangeSelection,
  $setSelection,
  TextNode,
  LexicalEditor,
} from "lexical";
import { EmojiNode } from "../../nodes/EmojiNode";

const EMOJI_TEST_REGEX = /:([a-zA-Z0-9_]+):/;
const EMOJI_MATCH_REGEX = /:([a-zA-Z0-9_]+):/g;

function transformEmojiTextToNode(editor: LexicalEditor) {
  editor.update(() => {
    // Current selection info
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

    textNodes.forEach((node) => {
      const textContent = node.getTextContent();
      if (!EMOJI_TEST_REGEX.test(textContent)) {
        return; // no emoji pattern, skip
      }

      const matches = Array.from(textContent.matchAll(EMOJI_MATCH_REGEX));
      if (matches.length === 0) {
        return;
      }

      let lastIndex = 0;
      const newNodes: (TextNode | EmojiNode)[] = [];
      let cursorNode: TextNode | null = null;

      // Go through each :emoji: match
      matches.forEach((match) => {
        const emojiText = match[0]; // e.g. ":smile:"
        const emojiId = match[1]; // e.g. "smile"
        const startIndex = match.index!;
        const endIndex = startIndex + emojiText.length;

        // 1) Text before the match
        if (startIndex > lastIndex) {
          const beforeStr = textContent.slice(lastIndex, startIndex);
          if (beforeStr.length > 0) {
            newNodes.push(new TextNode(beforeStr));
          }
        }

        // 2) The emoji node
        const emojiNode = new EmojiNode(emojiId);
        newNodes.push(emojiNode);

        // 3) Trailing empty text node (for the cursor if user typed here)
        const trailingTextNode = new TextNode("");
        newNodes.push(trailingTextNode);

        // If the old cursor was inside this matched range, remember to place it here
        if (
          anchorNodeKey === node.getKey() &&
          anchorOffset >= startIndex &&
          anchorOffset <= endIndex
        ) {
          cursorNode = trailingTextNode;
        }

        lastIndex = endIndex;
      });

      // Finally, leftover text after the last match
      if (lastIndex < textContent.length) {
        const afterStr = textContent.slice(lastIndex);
        // Append leftover text to the last new node if it's a TextNode
        // or create a new text node
        let lastCreated = newNodes[newNodes.length - 1];
        if (lastCreated instanceof TextNode) {
          lastCreated.setTextContent(lastCreated.getTextContent() + afterStr);
        } else {
          newNodes.push(new TextNode(afterStr));
        }
      }

      // Insert new nodes after the original node
      let prev: TextNode | EmojiNode = node;
      newNodes.forEach((n) => {
        prev.insertAfter(n);
        prev = n;
      });

      // Remove the old node
      node.remove();

      // If we identified a "cursorNode", set the selection to that node offset 0
      if (cursorNode) {
        const cursorTextNodeKey = (cursorNode as TextNode).getKey();
        const newSelection = $createRangeSelection();
        newSelection.anchor.set(cursorTextNodeKey, 0, "text");
        newSelection.focus.set(cursorTextNodeKey, 0, "text");
        $setSelection(newSelection);
      }
    });
  });
}

const EmojiPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    transformEmojiTextToNode(editor);

    return editor.registerMutationListener(TextNode, (mutation) => {
      editor.update(() => {
        mutation.keys().forEach((key) => {
          const type = mutation.get(key);
          if (type === "created" || type === "updated") {
            const node = $getNodeByKey(key);
            if (node instanceof TextNode) {
              const textContent = node.getTextContent();
              if (EMOJI_TEST_REGEX.test(textContent)) {
                transformEmojiTextToNode(editor);
              }
            }
          }
        });
      });
    });
  }, [editor]);

  return null;
};

export default EmojiPlugin;
