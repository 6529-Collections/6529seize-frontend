"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLayoutEffect } from "react";

/** Lock the submitted draft without ending iOS's contenteditable input session. */
export default function SubmissionLockPlugin({
  locked,
}: {
  readonly locked: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => {
    if (!locked) return;
    let submittedState = editor.getEditorState();
    const preventEdit = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const restoreInput = (event: Event) => {
      preventEdit(event);
      // IME and autocorrection can emit non-cancellable input events.
      editor.setEditorState(submittedState.clone(), {
        tag: "composer-submit-lock",
      });
    };
    const preventEditingKey = (event: KeyboardEvent) => {
      if (
        event.key.length === 1 ||
        ["Backspace", "Delete", "Enter"].includes(event.key)
      ) {
        if (
          (event.metaKey || event.ctrlKey) &&
          ["a", "c"].includes(event.key.toLowerCase())
        )
          return;
        preventEdit(event);
      }
    };
    const blockedEvents = [
      "beforeinput",
      "paste",
      "cut",
      "drop",
      "compositionstart",
      "compositionend",
    ];
    const unregisterRoot = editor.registerRootListener((root, previousRoot) => {
      // This Lexical version derives aria-readonly solely from isEditable.
      // Keep its native input session while exposing the temporary edit lock.
      previousRoot?.removeAttribute("aria-readonly");
      root?.setAttribute("aria-readonly", "true");
      for (const event of blockedEvents) {
        previousRoot?.removeEventListener(event, preventEdit, true);
        root?.addEventListener(event, preventEdit, true);
      }
      previousRoot?.removeEventListener("input", restoreInput, true);
      previousRoot?.removeEventListener("keydown", preventEditingKey, true);
      root?.addEventListener("input", restoreInput, true);
      root?.addEventListener("keydown", preventEditingKey, true);
    });
    const unregisterUpdates = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, tags }) => {
        if (tags.has("composer-reset")) {
          submittedState = editorState;
        } else if (
          !tags.has("composer-submit-lock") &&
          (dirtyElements.size > 0 || dirtyLeaves.size > 0)
        ) {
          editor.setEditorState(submittedState.clone(), {
            tag: "composer-submit-lock",
          });
        }
      }
    );
    return () => {
      unregisterUpdates();
      unregisterRoot();
    };
  }, [editor, locked]);
  return null;
}
