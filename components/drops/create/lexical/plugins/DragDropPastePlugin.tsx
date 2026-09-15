"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import type { EditorState, RangeSelection } from "lexical";
import {
  $getSelection,
  $getNodeByKey,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from "lexical";
import { useEffect, useLayoutEffect, useRef } from "react";
import { $createImageNode } from "../nodes/ImageNode";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import { useAuth } from "@/components/auth/Auth";
import { getContentType } from "@/services/uploads/mediaUploadMimeType";

import { filterValidDropUploadFiles } from "@/services/uploads/dropUploadValidation";
import { validateDropImageSignature } from "@/services/uploads/prepareDropImage";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";

const isImageFile = (file: File): boolean =>
  getContentType(file).startsWith("image/");

const INLINE_IMAGE_UPLOAD_TIMEOUT_MS = 180_000;
const TEXT_HTML_MIME_TYPE = "text/html";
const TEXT_PLAIN_MIME_TYPE = "text/plain";
const DATA_IMAGE_URL_PATTERN =
  /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;
const NEWLINE_OR_TAB_REGEX = /(\r?\n|\t)/;

function getFileExtension(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    default:
      return mimeType.split("/")[1]?.replaceAll("+", "-") || "png";
  }
}

function dataUrlToImageFile(dataUrl: string, index: number): File | null {
  const match = DATA_IMAGE_URL_PATTERN.exec(dataUrl.trim());
  if (!match || typeof globalThis.atob !== "function") {
    return null;
  }

  const [, mimeType, base64] = match;
  if (!mimeType || !base64) {
    return null;
  }

  try {
    const binary = globalThis.atob(base64.replaceAll(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File(
      [bytes],
      `pasted-image-${index}.${getFileExtension(mimeType)}`,
      {
        type: mimeType,
      }
    );
  } catch {
    return null;
  }
}

function getHtmlDataImageFiles(html: string): File[] {
  if (!html || typeof globalThis.document === "undefined") {
    return [];
  }

  const template = globalThis.document.createElement("template");
  template.innerHTML = html;

  return Array.from(template.content.querySelectorAll("img"))
    .map((image, index) =>
      dataUrlToImageFile(image.getAttribute("src") ?? "", index)
    )
    .filter((file): file is File => file !== null);
}

function getDataTransferFiles(dataTransfer: DataTransfer): File[] {
  const files = Array.from(dataTransfer.files ?? []);
  const seenFiles = new Set(files);

  for (const item of Array.from(dataTransfer.items ?? [])) {
    if (item.kind !== "file") {
      continue;
    }

    const file = item.getAsFile();
    if (file && !seenFiles.has(file)) {
      seenFiles.add(file);
      files.push(file);
    }
  }

  const hasImageFile = files.some((file) => isImageFile(file));
  const htmlDataImageFiles = getHtmlDataImageFiles(
    dataTransfer.getData(TEXT_HTML_MIME_TYPE)
  );

  if (!hasImageFile && htmlDataImageFiles.length > 0) {
    files.push(...htmlDataImageFiles);
  }

  return files;
}

function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  const controller = new AbortController();

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      controller.abort();
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([run(controller.signal), timeoutPromise]).finally(() => {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
  });
}

function insertRangeSelectionText(
  selection: RangeSelection,
  text: string
): void {
  const parts = text.split(NEWLINE_OR_TAB_REGEX);
  if (parts[parts.length - 1] === "") {
    parts.pop();
  }

  for (const part of parts) {
    if (part === "\n" || part === "\r\n") {
      selection.insertParagraph();
      continue;
    }

    if (part === "\t") {
      selection.insertText(part);
      continue;
    }

    if (part.length === 0) {
      continue;
    }

    selection.insertText(part);
  }
}

function insertPlainText(text: string): void {
  if (!text.length) {
    return;
  }

  const selection = $getSelection();
  if (!selection) {
    return;
  }

  if ($isRangeSelection(selection)) {
    insertRangeSelectionText(selection, text);
    return;
  }

  selection.insertRawText(text);
}

async function uploadImage(file: File): Promise<string> {
  const multiPart = await withTimeout(
    (signal) => multiPartUpload({ file, path: "drop", signal }),
    INLINE_IMAGE_UPLOAD_TIMEOUT_MS,
    "Image upload timed out. Please try again."
  );
  return multiPart.url;
}

export default function DragDropPaste({
  disabled = false,
  onAttachmentFiles,
  onUploadEditorStateChange,
}: {
  readonly disabled?: boolean | undefined;
  readonly onAttachmentFiles?: ((files: File[]) => void) | undefined;
  readonly onUploadEditorStateChange?:
    | ((editorState: EditorState) => void)
    | undefined;
}): null {
  const { setToast } = useAuth();
  const locale = useBrowserLocale();
  const onAttachmentFilesRef = useRef(onAttachmentFiles);
  const onUploadEditorStateChangeRef = useRef(onUploadEditorStateChange);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onAttachmentFilesRef.current = onAttachmentFiles;
  }, [onAttachmentFiles]);

  useLayoutEffect(() => {
    onUploadEditorStateChangeRef.current = onUploadEditorStateChange;
  }, [onUploadEditorStateChange]);

  useLayoutEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let isMounted = true;
    const isActive = () => isMounted && !disabledRef.current;
    const syncUploadEditorStateWhenDisabled = () => {
      if (!disabledRef.current) {
        return;
      }

      onUploadEditorStateChangeRef.current?.(editor.getEditorState());
    };

    const updateImageNode = (key: string, url?: string) => {
      editor.update(
        () => {
          const node = $getNodeByKey(key);
          if (url) node?.replace($createImageNode({ src: url }));
          else node?.remove();
        },
        { onUpdate: syncUploadEditorStateWhenDisabled }
      );
    };

    const insertImage = async (file: File) => {
      let key: string | undefined;
      try {
        if (!isActive()) return;
        editor.update(
          () => {
            const imageNode = $createImageNode({ src: "loading" });
            $insertNodes([imageNode]);
            key = imageNode.getKey();
          },
          { discrete: true }
        );
        await validateDropImageSignature(file, locale);
        if (!isActive()) {
          if (isMounted && key) updateImageNode(key);
          return;
        }
        const url = await uploadImage(file);
        if (isMounted && key) updateImageNode(key, url);
      } catch (error) {
        if (!isMounted) return;
        if (key) updateImageNode(key);
        setToast({
          type: "error",
          title: t(locale, "drop.upload.invalidFile", { file: file.name }),
          description: error instanceof Error ? error.message : String(error),
          autoClose: false,
        });
      }
    };

    const processFiles = (files: File[], plainText = "") => {
      if (!isActive()) return;
      const validFiles = filterValidDropUploadFiles(files, setToast, locale);
      const attachmentFiles = validFiles.filter((file) => !isImageFile(file));
      if (attachmentFiles.length)
        onAttachmentFilesRef.current?.(attachmentFiles);
      for (const file of validFiles.filter(isImageFile)) void insertImage(file);
      if (plainText) editor.update(() => insertPlainText(plainText));
    };

    const unregisterPaste = editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        const clipboardFiles = getDataTransferFiles(clipboardData);
        if (clipboardFiles.length === 0) {
          return false;
        }

        event.preventDefault();

        if (disabledRef.current) {
          return true;
        }

        processFiles(
          clipboardFiles,
          clipboardData.getData(TEXT_PLAIN_MIME_TYPE)
        );
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterDragDropPaste = editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        if (disabledRef.current) {
          return true;
        }

        processFiles(files);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterPaste();
      unregisterDragDropPaste();
      isMounted = false;
    };
  }, [editor, setToast, locale]);
  return null;
}
