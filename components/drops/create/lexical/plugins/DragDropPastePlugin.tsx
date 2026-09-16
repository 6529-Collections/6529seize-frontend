"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import type { EditorState, RangeSelection } from "lexical";
import {
  $addUpdateTag,
  $getSelection,
  $getNodeByKey,
  $insertNodes,
  $isRangeSelection,
  $nodesOfType,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from "lexical";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { $createImageNode, $isImageNode, ImageNode } from "../nodes/ImageNode";
import InlineImageViewportPlugin from "./InlineImageViewportPlugin";
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

/** Matches separate File wrappers for the same clipboard entry. */
function getClipboardFileSignature(file: File): string {
  return JSON.stringify([
    file.name,
    file.size,
    file.type,
    file.lastModified,
  ]);
}

/** Combines clipboard file views while keeping distinct file items. */
function getDataTransferFiles(dataTransfer: DataTransfer): File[] {
  const files = Array.from(dataTransfer.files ?? []);
  const remainingFilesBySignature = new Map<string, number>();
  for (const file of files) {
    const signature = getClipboardFileSignature(file);
    remainingFilesBySignature.set(
      signature,
      (remainingFilesBySignature.get(signature) ?? 0) + 1
    );
  }

  // Chrome can expose one image in both collections as different File objects.
  const items = "items" in dataTransfer ? dataTransfer.items : [];
  for (const item of Array.from(items)) {
    if (item.kind !== "file") {
      continue;
    }

    const file = item.getAsFile();
    if (!file) {
      continue;
    }
    const signature = getClipboardFileSignature(file);
    const remaining = remainingFilesBySignature.get(signature) ?? 0;
    if (remaining > 0) {
      remainingFilesBySignature.set(signature, remaining - 1);
    } else {
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
}) {
  const { setToast } = useAuth();
  const locale = useBrowserLocale();
  const [pendingUploads, setPendingUploads] = useState(0);
  const onAttachmentFilesRef = useRef(onAttachmentFiles);
  const onUploadEditorStateChangeRef = useRef(onUploadEditorStateChange);
  const disabledRef = useRef(disabled);
  const localeRef = useRef(locale);

  useEffect(() => {
    onAttachmentFilesRef.current = onAttachmentFiles;
  }, [onAttachmentFiles]);

  useLayoutEffect(() => {
    onUploadEditorStateChangeRef.current = onUploadEditorStateChange;
  }, [onUploadEditorStateChange]);

  useLayoutEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useLayoutEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let isMounted = true;
    // Keep results only while an image or its undo history retains the token.
    // Detaching a node alone does not mean redo can no longer restore it.
    const uploadResults = new WeakMap<object, string | null>();
    const previewUrls = new Map<string, string>();
    const isActive = () => isMounted && !disabledRef.current;
    const syncUploadEditorStateWhenDisabled = () => {
      if (!disabledRef.current) {
        return;
      }

      onUploadEditorStateChangeRef.current?.(editor.getEditorState());
    };

    const updateUpload = (update: () => void) => {
      editor.update(
        () => {
          // These tags are supported by the installed Lexical version. A
          // background upload must not steal focus or add an undo step.
          $addUpdateTag("history-merge");
          $addUpdateTag("collaboration");
          $addUpdateTag("skip-scroll-into-view");
          update();
        },
        {
          tag: "composer-image-upload",
          onUpdate: syncUploadEditorStateWhenDisabled,
        }
      );
    };

    const applyUploadResult = (key: string, url: string | null) => {
      const node = $getNodeByKey(key);
      if (
        !$isImageNode(node) ||
        !node.isAttached() ||
        node.getSrc() !== "loading"
      )
        return;
      if (url) node.setSrc(url);
      else node.remove();
    };

    const finishUpload = (key: string, token: object, url: string | null) => {
      uploadResults.set(token, url);
      updateUpload(() => applyUploadResult(key, url));
    };

    const unregisterHistory = editor.registerUpdateListener(({ tags }) => {
      if (!tags.has("historic")) return;
      updateUpload(() => {
        for (const node of $nodesOfType(ImageNode)) {
          if (node.getSrc() !== "loading") continue;
          const result = uploadResults.get(node.getUploadToken());
          if (result !== undefined) applyUploadResult(node.getKey(), result);
        }
      });
    });

    const uploadInsertedImage = async (
      file: File,
      key: string,
      token: object
    ) => {
      try {
        await validateDropImageSignature(file, localeRef.current);
        if (!isActive()) {
          if (isMounted) finishUpload(key, token, null);
          return;
        }
        const previewUrl = URL.createObjectURL(file);
        previewUrls.set(key, previewUrl);
        updateUpload(() => {
          const node = $getNodeByKey(key);
          if ($isImageNode(node) && node.isAttached())
            node.setPreviewSrc(previewUrl);
        });
        const url = await uploadImage(file);
        if (isMounted) finishUpload(key, token, url);
      } catch (error) {
        if (!isMounted) return;
        finishUpload(key, token, null);
        setToast({
          type: "error",
          title: t(localeRef.current, "drop.upload.invalidFile", {
            file: file.name,
          }),
          description: error instanceof Error ? error.message : String(error),
          autoClose: false,
        });
      } finally {
        const previewUrl = previewUrls.get(key);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrls.delete(key);
        if (isMounted) setPendingUploads((count) => count - 1);
      }
    };

    const processFiles = (files: File[], plainText = "") => {
      if (!isActive()) return;
      const validFiles = filterValidDropUploadFiles(
        files,
        setToast,
        localeRef.current
      );
      const attachmentFiles = validFiles.filter((file) => !isImageFile(file));
      if (attachmentFiles.length)
        onAttachmentFilesRef.current?.(attachmentFiles);
      const imageFiles = validFiles.filter(isImageFile);
      if (!imageFiles.length && !plainText) return;
      const uploads: { file: File; key: string; token: object }[] = [];
      editor.update(
        () => {
          $addUpdateTag("history-push");
          for (const file of imageFiles) {
            const imageNode = $createImageNode({ src: "loading" });
            $insertNodes([imageNode]);
            uploads.push({
              file,
              key: imageNode.getKey(),
              token: imageNode.getUploadToken(),
            });
          }
          if (plainText) insertPlainText(plainText);
        },
        {
          discrete: true,
          tag: "composer-image-insert",
          // Paste/drop commands already run inside a Lexical update. Start
          // uploads after that transaction has actually inserted the nodes.
          onUpdate: () => {
            if (!isMounted) return;
            setPendingUploads((count) => count + uploads.length);
            for (const { file, key, token } of uploads) {
              void uploadInsertedImage(file, key, token);
            }
          },
        }
      );
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
      unregisterHistory();
      isMounted = false;
      for (const url of previewUrls.values()) URL.revokeObjectURL(url);
      previewUrls.clear();
    };
  }, [editor, setToast]);
  return (
    <>
      <InlineImageViewportPlugin />
      <span role="status" className="tw-sr-only">
        {pendingUploads > 0 ? t(locale, "drop.composer.uploadingImage") : ""}
      </span>
    </>
  );
}
