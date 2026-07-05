"use client";

import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $insertNodes } from "lexical";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useCreateDropEmojiPickerLayer } from "./CreateDropEmojiPickerLayerContext";
import LazyEmojiPicker, { type EmojiPickerSelection } from "./LazyEmojiPicker";

interface CreateDropEmojiPickerProps {
  disabled?: boolean | undefined;
  top?: string | undefined;
}

interface CreateDropEmojiPickerContentProps {
  disabled: boolean;
  top: string;
}

const CreateDropEmojiPickerContent: FC<CreateDropEmojiPickerContentProps> = ({
  disabled,
  top,
}) => {
  const isMobile = useIsMobileScreen();
  const { desktopZIndex, mobileZIndexClassName } =
    useCreateDropEmojiPickerLayer();

  const [editor] = useLexicalComposerContext();
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [pickerPosition, setPickerPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  const isPickerOpen = showPicker && !disabled;

  const getPickerPosition = () => {
    const button = buttonRef.current;

    if (!button) {
      return null;
    }

    const rect = button.getBoundingClientRect();

    return {
      top: rect.top + globalThis.scrollY - 420,
      left: rect.left + globalThis.scrollX - 250,
    };
  };

  const handleTogglePicker = () => {
    if (disabled) {
      return;
    }

    if (isPickerOpen) {
      setShowPicker(false);
      return;
    }

    const nextPickerPosition = getPickerPosition();

    if (nextPickerPosition) {
      setPickerPosition(nextPickerPosition);
    }

    setShowPicker(true);
  };

  const addEmoji = (emoji: EmojiPickerSelection) => {
    if (disabled) {
      setShowPicker(false);
      return;
    }

    let emojiText = emoji.native;
    if (!emojiText && emoji.id) {
      emojiText = `:${emoji.id}:`;
    }
    if (emojiText) {
      editor.update(() => {
        const emojiNode = $createTextNode(emojiText);
        $insertNodes([emojiNode]);
      });

      // Ensure editor is focused and state is updated
      requestAnimationFrame(() => {
        editor.focus();
        // Force OnChangePlugin to fire with empty update
        editor.update(() => {
          // Empty update to trigger onChange
        });
      });
    }
    setShowPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPickerOpen]);

  return (
    <>
      <div
        className={`tw-absolute tw-right-2 ${top} tw-flex tw-items-start tw-justify-center`}
      >
        <button
          ref={buttonRef}
          className="tw-flex tw-items-center tw-justify-center tw-rounded tw-border-none tw-bg-transparent tw-p-[0.35rem] tw-opacity-50 tw-transition tw-duration-150 hover:tw-bg-[rgb(40,40,40)] hover:tw-text-[#FFCC22] hover:tw-opacity-100"
          onClick={handleTogglePicker}
          disabled={disabled}
          type="button"
          aria-label={isPickerOpen ? "Close emoji picker" : "Open emoji picker"}
          aria-expanded={isPickerOpen}
        >
          <svg
            className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            aria-hidden="true"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <g transform="scale(0.024)">
              <path d="M958 104h-62V43q0-17-12-29T855 2h-87q-17 0-29 12t-12 29v61h-62q-17 0-29 12t-12 29v4q-81-34-169-34-116 0-217 59-97 57-154 154-58 100-58 216.5T84 761q57 98 154 155 101 58 217.5 58T672 916q97-57 154-155 59-100 59-216 0-88-34-168h4q17 0 29-12t12-29v-62h62q17 0 29-12t12-29v-88q0-17-12-29t-29-12zM644 348q29 0 49.5 20.5t20.5 49-20.5 49T644 487t-49.5-20.5-20.5-49 20.5-49T644 348zm-377 0q29 0 49.5 20.5t20.5 49-20.5 49T267 487t-49.5-20.5-20.5-49 20.5-49T267 348zm473 255q-10 70-50.5 126.5t-102 88.5-132 32-132-32-102-88.5T171 603q-2-16 8.5-27.5T206 564h499q16 0 26.5 11.5T740 603zm218-370H855v103h-87V233H665v-88h103V43h87v102h103v88z"></path>
            </g>
          </svg>
        </button>

        {!isMobile &&
          isPickerOpen &&
          createPortal(
            <div
              ref={pickerRef}
              style={{
                position: "absolute",
                top: pickerPosition.top,
                left: pickerPosition.left,
                zIndex: desktopZIndex,
              }}
              className="tw-rounded-lg tw-border tw-bg-iron-800 tw-p-[1px] tw-shadow-lg"
            >
              <LazyEmojiPicker onEmojiSelect={addEmoji} autoFocus />
            </div>,
            document.body
          )}
      </div>

      {isMobile && (
        <MobileWrapperDialog
          isOpen={isPickerOpen}
          onClose={() => setShowPicker(false)}
          zIndexClassName={mobileZIndexClassName}
        >
          <div
            className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center"
            onTouchMove={(e) => e.stopPropagation()}
          >
            <LazyEmojiPicker onEmojiSelect={addEmoji} autoFocus />
          </div>
        </MobileWrapperDialog>
      )}
    </>
  );
};

const CreateDropEmojiPicker: FC<CreateDropEmojiPickerProps> = ({
  disabled = false,
  top = "tw-top-2",
}) => (
  <CreateDropEmojiPickerContent
    key={disabled ? "disabled" : "enabled"}
    disabled={disabled}
    top={top}
  />
);

export default CreateDropEmojiPicker;
