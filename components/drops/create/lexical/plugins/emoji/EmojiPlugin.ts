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
  NodeMutation,
} from "lexical";
import { EmojiNode } from "../../nodes/EmojiNode";

export const EMOJI_TEST_REGEX = /:(\w+)/;
export const EMOJI_MATCH_REGEX = /:(\w+):/g;

function transformEmojiTextToNode(editor: LexicalEditor) {
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

    textNodes.forEach((node) => {
      const textContent = node.getTextContent();
      if (!EMOJI_TEST_REGEX.test(textContent)) {
        return;
      }

      const matches = Array.from(textContent.matchAll(EMOJI_MATCH_REGEX));
      if (matches.length === 0) {
        return;
      }

      let lastIndex = 0;
      const newNodes: (TextNode | EmojiNode)[] = [];
      let cursorNode: TextNode | null = null;

      matches.forEach((match) => {
        const emojiText = match[0];
        const emojiId = match[1];
        const startIndex = match.index!;
        const endIndex = startIndex + emojiText.length;

        if (startIndex > lastIndex) {
          const beforeStr = textContent.slice(lastIndex, startIndex);
          if (beforeStr.length > 0) {
            newNodes.push(new TextNode(beforeStr));
          }
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
      });

      if (lastIndex < textContent.length) {
        const afterStr = textContent.slice(lastIndex);
        let lastCreated = newNodes[newNodes.length - 1];
        if (lastCreated instanceof TextNode) {
          lastCreated.setTextContent(lastCreated.getTextContent() + afterStr);
        } else {
          newNodes.push(new TextNode(afterStr));
        }
      }

      let prev: TextNode | EmojiNode = node;
      newNodes.forEach((n) => {
        prev.insertAfter(n);
        prev = n;
      });

      node.remove();

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

  const handleMutation = (
    mutation: Map<string, NodeMutation>,
    editor: LexicalEditor
  ): void => {
    editor.update(() => {
      mutation.forEach((type, key) => {
        if (shouldTransform(type, key)) {
          transformEmojiTextToNode(editor);
        }
      });
    });
  };

  const shouldTransform = (type: NodeMutation, key: string): boolean => {
    if (type !== "created" && type !== "updated") return false;

    const node = $getNodeByKey(key);
    return (
      node instanceof TextNode && EMOJI_TEST_REGEX.test(node.getTextContent())
    );
  };

  useEffect(() => {
    transformEmojiTextToNode(editor);

    return editor.registerMutationListener(TextNode, (mutation) => {
      handleMutation(mutation, editor);
    });
  }, [editor]);

  return null;
};

export default EmojiPlugin;
