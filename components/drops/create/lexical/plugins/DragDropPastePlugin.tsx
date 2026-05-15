"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { $getNodeByKey, $insertNodes, COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect, useRef } from "react";
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
}: {
  readonly disabled?: boolean | undefined;
  readonly onAttachmentFiles?: ((files: File[]) => void) | undefined;
}): null {
  const { setToast } = useAuth();
  const onAttachmentFilesRef = useRef(onAttachmentFiles);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onAttachmentFilesRef.current = onAttachmentFiles;
  }, [onAttachmentFiles]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let isMounted = true;
    const unregister = editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        if (disabledRef.current) {
          return true;
        }

        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
          );
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
                    if (!isMounted || disabledRef.current) return;
                    editor.update(() => {
                      const node = $getNodeByKey(key);
                      if (node) {
                        node.replace($createImageNode({ src: url }));
                      }
                    });
                  })
                  .catch((err: unknown) => {
                    if (!isMounted || disabledRef.current) return;
                    editor.update(() => {
                      const node = $getNodeByKey(key);
                      if (node) {
                        node.remove();
                      }
                    });
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
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregister();
      isMounted = false;
    };
  }, [editor, setToast]);
  return null;
}
