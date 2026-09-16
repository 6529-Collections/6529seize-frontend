"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type NodeKey,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface ImageComponentProps {
  readonly src: string;
  readonly altText?: string | undefined;
  readonly nodeKey: NodeKey;
  readonly previewSrc?: string | undefined;
}

export default function ImageComponent({
  src,
  altText,
  nodeKey,
  previewSrc,
}: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const selectButtonRef = useRef<HTMLButtonElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const locale = useBrowserLocale();
  const isUploading = src === "loading";
  const imageSrc = isUploading ? previewSrc : src;
  const imageAlt = altText?.trim() ? altText : t(locale, "drop.composer.image");

  const removeImage = useCallback(() => {
    if (!editor.isEditable()) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node?.getType() === "image") {
        node.selectNext();
        node.remove();
      }
    });
    editor.focus();
  }, [editor, nodeKey]);

  useEffect(() => {
    const onDelete = (event: KeyboardEvent) => {
      if (!editor.isEditable()) return false;
      const selection = $getSelection();
      if (!$isNodeSelection(selection) || !selection.has(nodeKey)) return false;
      event.preventDefault();
      for (const node of selection.getNodes()) node.remove();
      return true;
    };
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          if (
            !(event.target instanceof Node) ||
            !selectButtonRef.current?.contains(event.target)
          )
            return false;
          if (!editor.isEditable()) return false;
          editor.getRootElement()?.focus({ preventScroll: true });
          clearSelection();
          setSelected(true);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
    );
  }, [editor, nodeKey, clearSelection, setSelected]);

  return (
    <span
      className="tw-relative tw-inline-block tw-min-w-8 tw-max-w-full tw-align-top"
      contentEditable={false}
    >
      <button
        ref={selectButtonRef}
        type="button"
        aria-label={t(locale, "drop.composer.selectImage")}
        aria-pressed={isSelected}
        disabled={!isEditable}
        className={`tw-block tw-max-w-full tw-overflow-hidden tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
          isSelected ? "tw-ring-2 tw-ring-primary-400" : ""
        }`}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            draggable={false}
            width={800}
            height={800}
            unoptimized
            className="tw-block tw-h-auto tw-w-auto tw-max-w-full tw-object-contain"
            style={{
              maxHeight: "var(--composer-image-height, min(10rem, 16vh))",
            }}
          />
        ) : (
          <span
            className="tw-block tw-w-32"
            style={{ height: "var(--composer-image-height, min(10rem, 16vh))" }}
          />
        )}
      </button>
      {isUploading && (
        <span
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-950/30 tw-text-iron-100"
        >
          <CircleLoader size={CircleLoaderSize.MEDIUM} />
        </span>
      )}
      <button
        type="button"
        aria-label={t(locale, "drop.composer.removeImage")}
        disabled={!isEditable}
        onClick={removeImage}
        className="tw-absolute tw-right-1 tw-top-1 tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/60 tw-text-white hover:tw-bg-black/80 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <XMarkIcon className="tw-size-4" aria-hidden="true" />
      </button>
    </span>
  );
}
