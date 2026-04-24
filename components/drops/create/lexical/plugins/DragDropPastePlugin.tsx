"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { $getNodeByKey, $insertNodes, COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";
import { $createImageNode } from "../nodes/ImageNode";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import { useAuth } from "@/components/auth/Auth";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/webp",
];

const ACCEPTABLE_ATTACHMENT_TYPES = [
  "video/",
  "application/pdf",
  "text/csv",
  "application/csv",
];

const ACCEPTABLE_ATTACHMENT_EXTENSIONS = [".pdf", ".csv"];

function isAcceptableAttachment(file: File): boolean {
  if (isMimeType(file, ACCEPTABLE_ATTACHMENT_TYPES)) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  return ACCEPTABLE_ATTACHMENT_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension)
  );
}

async function uploadImage(file: File): Promise<string> {
  const multiPart = await multiPartUpload({ file, path: "drop" });
  return multiPart.url;
}

export default function DragDropPaste({
  onAttachmentFiles,
}: {
  readonly onAttachmentFiles?: ((files: File[]) => void) | undefined;
}): null {
  const { setToast } = useAuth();

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
          const attachmentFiles = onAttachmentFiles
            ? files.filter(isAcceptableAttachment)
            : [];

          if (attachmentFiles.length > 0) {
            onAttachmentFiles?.(attachmentFiles);
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
  }, [editor, onAttachmentFiles, setToast]);
  return null;
}
