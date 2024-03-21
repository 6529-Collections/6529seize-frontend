import { FormEvent, useRef, useState } from "react";
import UserPageDropsSearchUser from "../../user/drops/UserPageDropsSearchUser";

export default function CreateDropTextAreaExample() {
    const [atPosition, setAtPosition] = useState(0);
    const [textAfterAt, setTextAfterAt] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mirrorRef = useRef<HTMLSpanElement>(null);

    const handleEvent = (e: FormEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      const cursorPosition = target.selectionStart;
      const textBeforeCursor = target.value.slice(0, cursorPosition);
      const lastWhitespaceIndex = Math.max(
        textBeforeCursor.lastIndexOf(" "),
        textBeforeCursor.lastIndexOf("\n")
      );

      if (lastWhitespaceIndex === -1) {
        if (textBeforeCursor.startsWith("@")) {
          setAtPosition(cursorPosition - textBeforeCursor.length + 1);
          setTextAfterAt(textBeforeCursor.slice(1));
          setIsOpen(true);
        } else {
          setTextAfterAt("");
        }
      } else {
        const textAfterLastWhitespace = textBeforeCursor.slice(
          lastWhitespaceIndex + 1
        );
        if (textAfterLastWhitespace.startsWith("@")) {
          setAtPosition(cursorPosition - textAfterLastWhitespace.length + 1);
          setTextAfterAt(textAfterLastWhitespace.slice(1));
          setIsOpen(true);
        } else {
          setTextAfterAt("");
        }
      }

      if (textareaRef.current && mirrorRef.current) {
        const lines = textareaRef.current.value
          .substr(0, textareaRef.current.selectionStart)
          .split("\n");
        for (let i = 0; i < lines.length - 1; i++) {
          lines[i] = "";
        }
        mirrorRef.current.textContent = lines.join("\n");
        const rects = mirrorRef.current.getClientRects();
        const lastRect = rects[rects.length - 1];
        const parentRect = textareaRef.current.getBoundingClientRect();
        const top =
          lastRect.bottom - parentRect.top - textareaRef.current.scrollTop;
        const width = lastRect.width;
        setCursorPosition({ top, left: width });
      }
    };

    const [textAreaValue, setTextAreaValue] = useState("");

    const onUserSelect = (user: string) => {
      setIsOpen(false);
      const textBeforeAt = textAreaValue.substring(0, atPosition);
      const textAfterAt = textAreaValue.substring(atPosition);

      const newText = textBeforeAt + user;

      // Set the new text
      setTextAreaValue(newText);
      if (textareaRef.current) {
        const position = newText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(position, position);
      }
    };

    return (
      <div className="tw-relative">
        <textarea
          ref={textareaRef}
          value={textAreaValue}
          onChange={(e) => setTextAreaValue(e.target.value)}
          onClick={handleEvent}
          onKeyUp={handleEvent}
          onScroll={handleEvent}
          className="tw-w-full tw-h-36 tw-absolute tw-top-0 tw-left-0 tw-font-mono tw-text-sm tw-p-5 tw-border tw-border-gray-400 tw-whitespace-pre  tw-max-w-xs tw-text-black tw-z-10"
        />
        <span
          ref={mirrorRef}
          className="tw-absolute tw-top-0 tw-left-0 tw-font-mono tw-text-sm tw-p-5 tw-border tw-border-transparent tw-whitespace-pre tw-opacity-0 tw-break-words tw-overflow-wrap tw-z-0"
        />
        {textAfterAt.length && isOpen && (
          <div
            style={{ top: cursorPosition.top, left: cursorPosition.left }}
            className="tw-absolute tw-z-20"
          >
            <UserPageDropsSearchUser
              handleOrWallet={textAfterAt}
              onUserSelect={onUserSelect}
            />
          </div>
        )}
      </div>
    );
}