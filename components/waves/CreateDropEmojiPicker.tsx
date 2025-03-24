import { useState, FC, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $insertNodes } from "lexical";
import useCapacitor from "../../hooks/useCapacitor";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";
import useIsMobileScreen from "../../hooks/isMobileScreen";
import { useEmoji } from "../../contexts/EmojiContext";

const CreateDropEmojiPicker: FC = () => {
  const { isCapacitor } = useCapacitor();
  const isMobile = useIsMobileScreen();

  const { emojiMap, categories, categoryIcons } = useEmoji();

  const [editor] = useLexicalComposerContext();
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [pickerPosition, setPickerPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  const addEmoji = (emoji: { native?: string; id?: string }) => {
    let emojiText = emoji.native;
    if (!emojiText && emoji.id) {
      emojiText = `:${emoji.id}:`;
    }
    if (emojiText) {
      editor.update(() => {
        const emojiNode = $createTextNode(emojiText);
        $insertNodes([emojiNode]);
      });
    }
    setShowPicker(false);
  };

  useEffect(() => {
    if (showPicker && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setPickerPosition({
        top: rect.top + window.scrollY - 420,
        left: rect.left + window.scrollX - 250,
      });
    }
  }, [showPicker]);

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

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  return (
    <>
      <div className="tw-absolute tw-py-2 tw-right-2 tw-top-0 tw-h-full tw-flex tw-items-start tw-justify-center">
        <button
          ref={buttonRef}
          className={`tw-border-none tw-rounded tw-bg-transparent hover:tw-bg-[rgb(40,40,40)] tw-opacity-50 hover:tw-opacity-100 tw-transition tw-duration-150 ${
            isCapacitor ? "tw-text-sm tw-py-1" : "tw-text-xl"
          }`}
          onClick={() => setShowPicker(!showPicker)}>
          🙂
        </button>

        {!isMobile &&
          showPicker &&
          createPortal(
            <div
              ref={pickerRef}
              style={{
                position: "absolute",
                top: pickerPosition.top,
                left: pickerPosition.left,
                zIndex: 1000,
              }}
              className="tw-shadow-lg tw-rounded-lg tw-border tw-bg-iron-800 tw-p-[1px]">
              <Picker
                theme="dark"
                data={data}
                onEmojiSelect={addEmoji}
                custom={emojiMap}
                categories={categories}
                categoryIcons={categoryIcons}
              />
            </div>,
            document.body
          )}
      </div>

      {isMobile && (
        <MobileWrapperDialog
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}>
          <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
            <div className="tw-h-[40vh]">
              <Picker
                theme="dark"
                data={data}
                onEmojiSelect={addEmoji}
                custom={emojiMap}
                categories={categories}
                categoryIcons={categoryIcons}
              />
            </div>
          </div>
        </MobileWrapperDialog>
      )}
    </>
  );
};

export default CreateDropEmojiPicker;
