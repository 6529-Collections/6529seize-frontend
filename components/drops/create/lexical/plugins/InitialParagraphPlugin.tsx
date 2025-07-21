import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $getRoot, $getSelection, $isRangeSelection } from "lexical";
import { useEffect } from "react";

/**
 * Plugin to ensure the editor always has at least one paragraph node.
 * This is especially important on mobile where empty editors might not be visible.
 */
export default function InitialParagraphPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Check initial state and add paragraph if empty
    editor.update(() => {
      const root = $getRoot();
      if (root.getChildrenSize() === 0) {
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        
        // Set selection to the new paragraph
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          paragraph.select();
        }
      }
    });
  }, [editor]);

  // Also handle when editor is cleared
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        if (root.getChildrenSize() === 0) {
          editor.update(() => {
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          });
        }
      });
    });
  }, [editor]);

  return null;
}