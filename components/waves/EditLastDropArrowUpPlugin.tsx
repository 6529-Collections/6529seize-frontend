"use client";

import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_HIGH, KEY_ARROW_UP_COMMAND } from "lexical";

export default function EditLastDropArrowUpPlugin({
  canEditLastDropWithArrow,
  onRequestEditLastDrop,
  canUseArrowUpShortcut,
}: {
  readonly canEditLastDropWithArrow: boolean;
  readonly onRequestEditLastDrop?: (() => boolean) | undefined;
  readonly canUseArrowUpShortcut: () => boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const canEditLastDropWithArrowRef = useRef(canEditLastDropWithArrow);
  const onRequestEditLastDropRef = useRef(onRequestEditLastDrop);
  const canUseArrowUpShortcutRef = useRef(canUseArrowUpShortcut);

  useEffect(() => {
    canEditLastDropWithArrowRef.current = canEditLastDropWithArrow;
  }, [canEditLastDropWithArrow]);

  useEffect(() => {
    onRequestEditLastDropRef.current = onRequestEditLastDrop;
  }, [onRequestEditLastDrop]);

  useEffect(() => {
    canUseArrowUpShortcutRef.current = canUseArrowUpShortcut;
  }, [canUseArrowUpShortcut]);

  useEffect(
    () =>
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event: KeyboardEvent) => {
          if (
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            event.shiftKey
          ) {
            return false;
          }

          if (
            !canEditLastDropWithArrowRef.current ||
            !onRequestEditLastDropRef.current ||
            !canUseArrowUpShortcutRef.current()
          ) {
            return false;
          }

          const handled = onRequestEditLastDropRef.current();
          if (!handled) {
            return false;
          }

          event.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
    [editor]
  );

  return null;
}
