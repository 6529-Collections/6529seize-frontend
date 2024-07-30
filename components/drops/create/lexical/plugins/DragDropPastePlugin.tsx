
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import {
  $getNodeByKey,
  $insertNodes,
  COMMAND_PRIORITY_LOW
} from "lexical";
import { useEffect } from "react";
import { commonApiPost } from "../../../../../services/api/common-api";
import { $createImageNode } from "../nodes/ImageNode";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/webp",
];

async function uploadImage(file: File): Promise<string> {
  const prep = await commonApiPost<
    {
      content_type: string;
      file_name: string;
      file_size: number;
    },
    {
      upload_url: string;
      content_type: string;
      media_url: string;
    }
  >({
    endpoint: "drop-media/prep",
    body: {
      content_type: file.type,
      file_name: file.name,
      file_size: file.size,
    },
  });
  const myHeaders = new Headers({
    "Content-Type": prep.content_type,
  });
  await fetch(prep.upload_url, {
    method: "PUT",
    headers: myHeaders,
    body: file,
  });
  return prep.media_url;
}

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
          );
          for (const { file } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              editor.update(() => {
                const imageNode = $createImageNode({ src: "loading" });
                $insertNodes([imageNode]);
                const key = imageNode.getKey();
                uploadImage(file).then((url: string) => {
                  editor.update(() => {
                    const node = $getNodeByKey(key);
                    if (node) {
                      node.replace($createImageNode({ src: url }));
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
  }, [editor]);
  return null;
}
