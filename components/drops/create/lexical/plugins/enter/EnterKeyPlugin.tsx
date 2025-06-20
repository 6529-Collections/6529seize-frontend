"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { $isHeadingNode } from "@lexical/rich-text";
import useIsMobileDevice from "../../../../../../hooks/isMobileDevice";
import useCapacitor from "../../../../../../hooks/useCapacitor";

export default function EnterKeyPlugin({
  disabled,
  handleSubmit,
  canSubmitWithEnter,
}: {
  readonly disabled: boolean;
  readonly handleSubmit: () => void;
  readonly canSubmitWithEnter: () => boolean;
}) {
  const isMobile = useIsMobileDevice();
  const { isCapacitor } = useCapacitor();

  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (disabled || !canSubmitWithEnter()) {
          // Let the mention plugin handle the Enter key
          return false; // Allows the mention plugin to process the Enter key
        }

        if (isMobile || isCapacitor) {
          return true;
        }
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          let parentNode = anchorNode.getParent();
          if (parentNode === null) {
            parentNode = anchorNode.getTopLevelElement();
          }

          // Check if the cursor is inside a list item
          if ($isListItemNode(parentNode) || $isListNode(parentNode)) {
            // Inside a list item: Let Lexical handle the 'Enter' key as usual
            return false; // Returning false allows default Lexical behavior
          }
          if ($isHeadingNode(parentNode) && event?.shiftKey) {
            event.preventDefault();
            editor.update(() => {
              const paragraphNode = $createParagraphNode();
              $insertNodes([paragraphNode]);
              paragraphNode.select();
            });
            return true;
          }
        }

        if (event?.shiftKey) {
          event.preventDefault();
          editor.update(() => {
            const paragraphNode = $createParagraphNode();
            $insertNodes([paragraphNode]);
            paragraphNode.select();
          });
          return false; // Prevents the default behavior
        } else {
          // Handle Enter (Submit)
          event?.preventDefault();
          handleSubmit(); // Your submit function
          return true; // Prevents the default behavior
        }
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, isMobile, isCapacitor]);

  return null;
}
