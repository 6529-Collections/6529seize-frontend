"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";
import { useEffect } from "react";

import { $ensureRootBlockSelection } from "../utils/rootContent";

export default function RootBlockGuardPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $ensureRootBlockSelection();
    });

    const normalizeRootSelection = () => $ensureRootBlockSelection();

    const removeTabGuard = editor.registerCommand(
      KEY_TAB_COMMAND,
      normalizeRootSelection,
      COMMAND_PRIORITY_CRITICAL
    );
    const removeIndentGuard = editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      normalizeRootSelection,
      COMMAND_PRIORITY_CRITICAL
    );
    const removeOutdentGuard = editor.registerCommand(
      OUTDENT_CONTENT_COMMAND,
      normalizeRootSelection,
      COMMAND_PRIORITY_CRITICAL
    );

    return () => {
      removeTabGuard();
      removeIndentGuard();
      removeOutdentGuard();
    };
  }, [editor]);

  return null;
}
