"use client";

import type { ComponentProps, FC, ReactNode } from "react";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $insertNodes } from "lexical";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";
import DropActionTooltip from "./drops/DropActionTooltip";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useCreateDropEmojiPickerLayer } from "./CreateDropEmojiPickerLayerContext";
import LazyEmojiPicker, { type EmojiPickerSelection } from "./LazyEmojiPicker";

interface CreateDropEmojiPickerProps {
  disabled?: boolean | undefined;
  top?: string | undefined;
  verticalAlignment?: "top" | "center" | undefined;
}

interface EmojiPickerControlProps extends CreateDropEmojiPickerProps {
  readonly onEmojiSelect: (emoji: EmojiPickerSelection) => void;
  readonly onOpen?: (() => void) | undefined;
  readonly label?: string | undefined;
  readonly pickerProps?:
    | Omit<ComponentProps<typeof LazyEmojiPicker>, "onEmojiSelect">
    | undefined;
  readonly pickerNotice?: ReactNode;
  /**
   * The mobile panel has closed after a selection and returned focus to its
   * trigger; the composer can put the caret back now.
   */
  readonly onClosedAfterSelect?: (() => void) | undefined;
}

/** Shared composer control: anchored on desktop and a slide panel on mobile. */
/** The desktop picker keeps this gap from the window's edges. */
const PICKER_VIEWPORT_MARGIN = 8;

export const EmojiPickerControl: FC<EmojiPickerControlProps> = ({
  disabled = false,
  top = "tw-top-2",
  verticalAlignment = "top",
  onEmojiSelect,
  onOpen,
  label,
  pickerProps,
  pickerNotice,
  onClosedAfterSelect,
}) => {
  const isMobile = useIsMobileScreen();
  const locale = useBrowserLocale();
  const pickerLabel = label ?? t(locale, "emoji.picker.label");
  const { desktopZIndex, mobileZIndexClassName } =
    useCreateDropEmojiPickerLayer();

  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDialogElement | null>(null);
  // Cancels a pending caret return: its focus listener, timer or frame.
  const focusReturn = useRef<{ cancel: (() => void) | null }>({
    cancel: null,
  });
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

    onOpen?.();
    setShowPicker(true);
  };

  /**
   * The mobile panel hands focus back to its trigger after its exit
   * animation, after any focus the composer set on selection. When that
   * happens (or the window passes), tell the composer to restore its caret.
   */
  const returnFocusAfterPanel = () => {
    const button = buttonRef.current;
    if (!onClosedAfterSelect || !button) return;
    const pending = focusReturn.current;
    pending.cancel?.();
    const stopWaiting = () => {
      button.removeEventListener("focus", finish);
      clearTimeout(timer);
      pending.cancel = null;
    };
    const finish = () => {
      stopWaiting();
      // Never pull focus back from something the user moved on to.
      const active = document.activeElement;
      if (active && active !== button && active !== document.body) return;
      const frame = requestAnimationFrame(() => {
        pending.cancel = null;
        onClosedAfterSelect();
      });
      pending.cancel = () => {
        cancelAnimationFrame(frame);
        pending.cancel = null;
      };
    };
    button.addEventListener("focus", finish);
    const timer = setTimeout(finish, 1000);
    pending.cancel = stopWaiting;
  };

  // Nothing reaches the composer after this control has unmounted.
  useEffect(() => {
    const pending = focusReturn.current;
    return () => pending.cancel?.();
  }, []);

  const addEmoji = (emoji: EmojiPickerSelection) => {
    if (!disabled) onEmojiSelect(emoji);
    if (isMobile) returnFocusAfterPanel();
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPicker(false);
        buttonRef.current?.focus();
      }
    };
    if (isPickerOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPickerOpen]);

  // The desktop picker opens to the left of its trigger at a fixed offset.
  // Near a window edge, slide it inside so it never widens the page. The
  // observer reports the first size before paint and again once the lazy
  // picker has loaded.
  useLayoutEffect(() => {
    const dialog = pickerRef.current;
    if (isMobile || !isPickerOpen || !dialog) return;
    const observer = new ResizeObserver(() => {
      const minLeft = globalThis.scrollX + PICKER_VIEWPORT_MARGIN;
      const maxLeft =
        globalThis.scrollX +
        document.documentElement.clientWidth -
        dialog.offsetWidth -
        PICKER_VIEWPORT_MARGIN;
      setPickerPosition((position) => {
        const left = Math.max(minLeft, Math.min(position.left, maxLeft));
        return left === position.left ? position : { ...position, left };
      });
    });
    observer.observe(dialog);
    return () => observer.disconnect();
  }, [isMobile, isPickerOpen]);

  return (
    <>
      <div
        className={`tw-absolute tw-right-2 tw-flex tw-justify-center ${
          verticalAlignment === "center"
            ? "tw-inset-y-0 tw-items-center"
            : `${top} tw-items-start`
        }`}
      >
        <DropActionTooltip
          content={pickerLabel}
          disabled={isPickerOpen || isMobile}
        >
          <button
            ref={buttonRef}
            className="tw-flex tw-items-center tw-justify-center tw-rounded tw-border-none tw-bg-transparent tw-p-[0.35rem] tw-opacity-50 tw-transition tw-duration-150 hover:tw-bg-[rgb(40,40,40)] hover:tw-text-[#FFCC22] hover:tw-opacity-100"
            onClick={handleTogglePicker}
            disabled={disabled}
            type="button"
            aria-label={
              label ??
              t(
                locale,
                isPickerOpen
                  ? "emoji.picker.closeLabel"
                  : "emoji.picker.openLabel"
              )
            }
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
        </DropActionTooltip>

        {!isMobile &&
          isPickerOpen &&
          createPortal(
            <dialog
              open
              ref={pickerRef}
              aria-label={pickerLabel}
              style={{
                position: "absolute",
                top: pickerPosition.top,
                left: pickerPosition.left,
                right: "auto",
                zIndex: desktopZIndex,
              }}
              className="tw-m-0 tw-max-w-none tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-p-[1px] tw-text-inherit tw-shadow-lg"
            >
              {pickerNotice}
              <LazyEmojiPicker
                {...pickerProps}
                onEmojiSelect={addEmoji}
                autoFocus
              />
            </dialog>,
            document.body
          )}
      </div>

      {isMobile && (
        <MobileWrapperDialog
          isOpen={isPickerOpen}
          ariaLabel={pickerLabel}
          onClose={() => setShowPicker(false)}
          zIndexClassName={mobileZIndexClassName}
          showHeaderCloseButton={false}
          enableDragToClose
        >
          <div
            className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center"
            onTouchMove={(e) => e.stopPropagation()}
          >
            {pickerNotice}
            <LazyEmojiPicker
              {...pickerProps}
              onEmojiSelect={addEmoji}
              autoFocus
            />
          </div>
        </MobileWrapperDialog>
      )}
    </>
  );
};

const CreateDropEmojiPicker: FC<CreateDropEmojiPickerProps> = (props) => {
  const [editor] = useLexicalComposerContext();
  const addEmoji = (emoji: EmojiPickerSelection) => {
    const text = emoji.native ?? (emoji.id ? `:${emoji.id}:` : null);
    if (!text) return;
    editor.update(() => $insertNodes([$createTextNode(text)]));
    requestAnimationFrame(() => {
      editor.focus();
      editor.update(() => {});
    });
  };
  return (
    <EmojiPickerControl
      key={props.disabled ? "disabled" : "enabled"}
      {...props}
      onEmojiSelect={addEmoji}
    />
  );
};

export default CreateDropEmojiPicker;
