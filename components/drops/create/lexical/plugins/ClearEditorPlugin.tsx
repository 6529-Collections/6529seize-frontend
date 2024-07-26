import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { forwardRef, useImperativeHandle } from "react";

export interface ClearEditorPluginHandles {
  clearEditorState: () => void;
}

const ClearEditorPlugin = forwardRef<ClearEditorPluginHandles, {}>((_, ref) => {
  const [editor] = useLexicalComposerContext();
  const clearEditorState = () => {
    editor.update(() => $getRoot().clear());
  };

  useImperativeHandle(ref, () => ({
    clearEditorState,
  }));
  return <></>;
});
ClearEditorPlugin.displayName = "ClearEditorPlugin";
export default ClearEditorPlugin;
