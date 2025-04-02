import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { $getNodeByKey, $insertNodes, COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";
import { $createImageNode } from "../nodes/ImageNode";
import { multiPartUpload } from "../../../../waves/create-wave/services/multiPartUpload";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/webp",
];

async function uploadImage(file: File): Promise<string> {
  alert("uploadImage - drag drop paste plugin");
  const multiPart = await multiPartUpload({ file, path: "drop" });
  return multiPart.url;
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
