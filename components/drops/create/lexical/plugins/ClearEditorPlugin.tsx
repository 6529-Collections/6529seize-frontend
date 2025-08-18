import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createParagraphNode } from "lexical";
import { forwardRef, useImperativeHandle } from "react";

export interface ClearEditorPluginHandles {
  clearEditorState: () => void;
}

const ClearEditorPlugin = forwardRef<ClearEditorPluginHandles, {}>((_, ref) => {
  const [editor] = useLexicalComposerContext();
  const clearEditorState = () => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      root.append(paragraph);
      paragraph.select();
    });
  };

  useImperativeHandle(ref, () => ({
    clearEditorState,
  }));
  return <></>;
});
ClearEditorPlugin.displayName = "ClearEditorPlugin";
export default ClearEditorPlugin;
