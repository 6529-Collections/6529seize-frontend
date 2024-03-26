import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  EditorState,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
} from "lexical";
import { useEffect, useState } from "react";

const newlinesRegex = /[\n\r]/g;

export default function SubmitPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let latestTextContent = "";
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        const editorState = editor.getEditorState();
        const textContent = editorState.read(() => $getRoot().getTextContent());
        const lastNode = editorState.read(() => $getRoot().getLastChild());
        const isMatch = textContent === latestTextContent;
        latestTextContent = textContent;
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
