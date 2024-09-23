import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_HIGH, KEY_ENTER_COMMAND } from "lexical";
import { useEffect } from "react";

export default function EnterKeyPlugin({
  disabled,
  handleSubmit,
  canSubmitWithEnter,
}: {
  readonly disabled: boolean;
  readonly handleSubmit: () => void;
  readonly canSubmitWithEnter: () => boolean;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (disabled || !canSubmitWithEnter()) {
          // Let the mention plugin handle the Enter key
          return false; // Allows the mention plugin to process the Enter key
        }

        if (event?.shiftKey) {
          return true; // Prevents the default behavior
        } else {
          // Handle Enter (Submit)
          event?.preventDefault();
          handleSubmit(); // Your submit function
          return true; // Prevents the default behavior
        }
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
