"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
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
import {
  ACCEPTED_FILE_TYPE_LABELS,
  isSupportedUploadFile,
} from "@/services/uploads/mediaUploadMimeType";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/webp",
];

const INLINE_IMAGE_UPLOAD_TIMEOUT_MS = 30_000;
const TEXT_HTML_MIME_TYPE = "text/html";
const TEXT_PLAIN_MIME_TYPE = "text/plain";
const DATA_IMAGE_URL_PATTERN =
  /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;
const NEWLINE_OR_TAB_REGEX = /(\r?\n|\t)/;

interface ClipboardFiles {
  readonly files: File[];
  readonly hasHtmlDataImage: boolean;
}

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

function getDataTransferFiles(dataTransfer: DataTransfer): ClipboardFiles {
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

  const hasImageFile = files.some((file) =>
    isMimeType(file, ACCEPTABLE_IMAGE_TYPES)
  );
  const htmlDataImageFiles = getHtmlDataImageFiles(
    dataTransfer.getData(TEXT_HTML_MIME_TYPE)
  );

  if (!hasImageFile && htmlDataImageFiles.length > 0) {
    files.push(...htmlDataImageFiles);
  }

  return {
    files,
    hasHtmlDataImage: htmlDataImageFiles.length > 0,
  };
}

function isAcceptableAttachment(file: File): boolean {
  return (
    isSupportedUploadFile(file) && !isMimeType(file, ACCEPTABLE_IMAGE_TYPES)
  );
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
    const syncUploadEditorStateWhenDisabled = () => {
      if (!disabledRef.current) {
        return;
      }

      onUploadEditorStateChangeRef.current?.(editor.getEditorState());
    };

    const processFiles = (files: File[], plainText = "") => {
      void (async () => {
        const filesResult = await mediaFileReader(
          files,
          [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
        );

        if (disabledRef.current || !isMounted) {
          return;
        }

        const currentOnAttachmentFiles = onAttachmentFilesRef.current;
        const attachmentFiles = currentOnAttachmentFiles
          ? files.filter(isAcceptableAttachment)
          : [];

        if (attachmentFiles.length > 0) {
          currentOnAttachmentFiles?.(attachmentFiles);
        }

        if (filesResult.length === 0 && attachmentFiles.length === 0) {
          setToast({
            message: `Unsupported file type. Accepted Types: ${ACCEPTED_FILE_TYPE_LABELS}`,
            type: "error",
          });
          return;
        }

        for (const { file } of filesResult) {
          if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
            editor.update(() => {
              const imageNode = $createImageNode({ src: "loading" });
              $insertNodes([imageNode]);
              const key = imageNode.getKey();
              uploadImage(file)
                .then((url: string) => {
                  if (!isMounted) return;
                  let replacedLoadingImage = false;
                  editor.update(
                    () => {
                      const node = $getNodeByKey(key);
                      if (node) {
                        node.replace($createImageNode({ src: url }));
                        replacedLoadingImage = true;
                      }
                    },
                    {
                      onUpdate: () => {
                        if (replacedLoadingImage) {
                          syncUploadEditorStateWhenDisabled();
                        }
                      },
                    }
                  );
                })
                .catch((err: unknown) => {
                  if (!isMounted) return;
                  let removedLoadingImage = false;
                  editor.update(
                    () => {
                      const node = $getNodeByKey(key);
                      if (node) {
                        node.remove();
                        removedLoadingImage = true;
                      }
                    },
                    {
                      onUpdate: () => {
                        if (removedLoadingImage) {
                          syncUploadEditorStateWhenDisabled();
                        }
                      },
                    }
                  );
                  setToast({
                    message:
                      err instanceof Error
                        ? err.message
                        : "Error uploading image. Please try again.",
                    type: "error",
                  });
                });
            });
          }
        }

        if (plainText) {
          editor.update(() => {
            insertPlainText(plainText);
          });
        }
      })();
    };

    const unregisterPaste = editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        const clipboardFiles = getDataTransferFiles(clipboardData);
        if (!clipboardFiles.hasHtmlDataImage) {
          return false;
        }

        if (clipboardFiles.files.length === 0) {
          return false;
        }

        event.preventDefault();

        if (disabledRef.current) {
          return true;
        }

        processFiles(
          clipboardFiles.files,
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
  }, [editor, setToast]);
  return null;
}
