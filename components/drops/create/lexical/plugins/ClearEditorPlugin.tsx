import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createParagraphNode, CLEAR_HISTORY_COMMAND } from "lexical";
import { forwardRef, useImperativeHandle } from "react";

export interface ClearEditorPluginHandles {
  clearEditorState: (options?: { readonly resetHistory?: boolean }) => void;
}

const ClearEditorPlugin = forwardRef<ClearEditorPluginHandles, {}>((_, ref) => {
  const [editor] = useLexicalComposerContext();
  const clearEditorState: ClearEditorPluginHandles["clearEditorState"] = (
    options
  ) => {
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        paragraph.select();
      },
      { discrete: true, tag: "composer-reset" }
    );
    if (options?.resetHistory) {
      editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
    }
  };

  useImperativeHandle(ref, () => ({
    clearEditorState,
  }));
  return <></>;
});
ClearEditorPlugin.displayName = "ClearEditorPlugin";
export default ClearEditorPlugin;
