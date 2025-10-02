import { $getSelection, $isRangeSelection } from "lexical";
import type { LexicalEditor, LexicalNode } from "lexical";
import { $isCodeNode } from "@lexical/code";

export function isInCodeContext(editor: LexicalEditor): boolean {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }

    if (selection.hasFormat("code")) {
      return true;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    const isNodeWithinCode = (node: LexicalNode | null) => {
      if (!node) {
        return false;
      }

      if ($isCodeNode(node)) {
        return true;
      }

      const topLevel = node.getTopLevelElement();
      return $isCodeNode(topLevel);
    };

    return isNodeWithinCode(anchorNode) || isNodeWithinCode(focusNode);
  });
}
