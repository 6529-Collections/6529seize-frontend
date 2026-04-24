"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { $getNodeByKey, $insertNodes, COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect, useRef } from "react";
import { $createImageNode } from "../nodes/ImageNode";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import { useAuth } from "@/components/auth/Auth";
import { isSupportedUploadFile } from "@/services/uploads/mediaUploadMimeType";

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
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
  });
}

async function uploadImage(file: File): Promise<string> {
  const multiPart = await withTimeout(
    multiPartUpload({ file, path: "drop" }),
    INLINE_IMAGE_UPLOAD_TIMEOUT_MS,
    "Image upload timed out. Please try again."
  );
  return multiPart.url;
}

export default function DragDropPaste({
  onAttachmentFiles,
}: {
  readonly onAttachmentFiles?: ((files: File[]) => void) | undefined;
}): null {
  const { setToast } = useAuth();
  const onAttachmentFilesRef = useRef(onAttachmentFiles);

  useEffect(() => {
    onAttachmentFilesRef.current = onAttachmentFiles;
  }, [onAttachmentFiles]);

  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let isMounted = true;
    const unregister = editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
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
              message: "Unsupported file type for Drag & Drop / Paste.",
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
                    editor.update(() => {
                      const node = $getNodeByKey(key);
                      if (node) {
                        node.replace($createImageNode({ src: url }));
                      }
                    });
                  })
                  .catch(() => {
                    if (!isMounted) return;
                    editor.update(() => {
                      const node = $getNodeByKey(key);
                      if (node) {
                        node.remove();
                      }
                    });
                    setToast({
                      message: "Error uploading image. Please try again.",
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
