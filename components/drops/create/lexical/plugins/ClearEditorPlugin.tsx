import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createParagraphNode, $setSelection } from "lexical";
import { forwardRef, useImperativeHandle } from "react";

export interface ClearEditorPluginHandles {
  clearEditorState: () => void;
}

const ClearEditorPlugin = forwardRef<ClearEditorPluginHandles, {}>((_, ref) => {
  const [editor] = useLexicalComposerContext();
  const clearEditorState = () => {
    const wasFocused = document.activeElement === editor.getRootElement();
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        if (wasFocused) {
          paragraph.select();
        } else {
          // Reset the draft without taking focus back from the Send button.
          $setSelection(null);
        }
      },
      { tag: "composer-reset" }
    );
  };

  useImperativeHandle(ref, () => ({
    clearEditorState,
  }));
  return <></>;
});
ClearEditorPlugin.displayName = "ClearEditorPlugin";
export default ClearEditorPlugin;
